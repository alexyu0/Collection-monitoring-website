from flask import Flask, jsonify, render_template, session, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text, create_engine, MetaData, Table
import os
import sys
import psycopg2
import psycopg2.extras
import subprocess
import datetime
# from logging import FileHandler

import logging, sys
logging.basicConfig(stream=sys.stderr)

app = Flask(__name__)
engine = create_engine('postgresql+psycopg2:///censorship_study')
metadata = MetaData(bind=engine)
con = engine.connect()

#full path to this file
sys.path.insert(0, '/var/www/wsgi')
import test3

@app.errorhandler(500)
def f(e):
    app.logger.debug(e)
    app.logger.error(e)
    return "There was an error. Please check the error log in /var/log/apache2/error.log"

#view function for monitoring current collector progress
@app.route("/collector_monitor", methods=['GET', 'POST'])
def monitor():
    currMin = (datetime.datetime.now()).minute
    currHr = (datetime.datetime.now()).hour
    updateTime = session.pop("updateTime",None)
    currTime = (currHr * 100) + currMin
    #updates if visited on 5 min intervals, or updates if been more than 5 
    #minutes since last update
    if (("monitor" in session) and ((currMin % 5 != 0) or 
        (updateTime == currTime)) and (currTime - updateTime < 5)):
        retVal = session.pop("monitor",None)
        session["monitor"] = retVal
        session["updateTime"] = updateTime
        return jsonify(result=[retVal,"from session",updateTime,currTime])
    else:
        #checks text file created every 5 minutes by dbreceiver cron job
        fStatus = open("/var/www/html/collectorInfo.txt","r")
        output = []
        #BASED ON CURRENT FORMAT OF CONTENTS OF TEXT FILE, WILL NEED TO CHANGE 
        #CORRESPONDINGLY IF FORMAT CHANGES
        for line in fStatus:
            if "not running" in line:
                output.append("Collector currently is not running")
                break
            elif "importing" in line:
                output.append("Collector results currently being imported into database in kenaz")
                break
            elif "collecting" in line:
                pass
            else:
                cc = line.split(",")[0]
                progress = round((float(line.split(",")[1]) * 100),2)
                if cc == "overall":
                    output.append("{0}% of done testing overall".format(progress))
                else:
                    if (int(progress) != 0) and (int(progress) != 1):
                        ccQuery = "'{0}';\n".format(cc)
                        query = text("""
                            SELECT name FROM country_codes WHERE cc2 = """ + ccQuery
                            )
                        result = engine.execute(query)
                        for row in result:
                            country = row[0]
                        output.append("{0}% of URLs tested for {1}".format(
                                                            progress, country))
        session["monitor"] = output
        session["updateTime"] = (currHr * 100) + currMin
        return jsonify(result = [output,"updated",currTime,updateTime])

#view function for generating all URL sources with results data
@app.route("/source_list", methods=['GET', 'POST'])
def source_list():
    """
    query gets list of sources for which there are results
    """
    query = text("""
        SELECT source
        FROM capture_counts
        GROUP BY source
        ORDER BY source;
            """)
    result = engine.execute(query)
    sourceList = []
    for row in result:
        sourceList.append(row["source"])
    return jsonify(result=sourceList)

#view function for generating results data grouped by URL source
@app.route("/source_data", methods=['GET', 'POST'])
def source_data():
    sourceName = request.json["sname"]
    if sourceName == "Unknown source":
        sourceName = "<missing>"
    srcQuery = "WHERE source = '{0}'\n".format(sourceName)
    
    #query gets number of live and parked urls from each country in each 
    #result, and provides average number of live and parked urls in each result
    query = text("""
            WITH c AS (
                SELECT country, result, is_parked, count,
                        row_number() OVER (ORDER BY country, result, 
                            is_parked) as "id"
                FROM capture_counts\n""" + srcQuery + """
                GROUP BY country, result, is_parked, count
                ORDER BY country, result, is_parked
            ), a AS (
                SELECT result, is_parked, avg(count) as "count",
                        row_number() OVER (ORDER BY result, is_parked) as "id"
                FROM capture_counts\n""" + srcQuery + """
                GROUP BY result, is_parked
                ORDER BY result, is_parked
            )
            SELECT c.country, c.result as "c_result", c.is_parked as "c_park", 
                    c.count as "c_count", a.result as "a_result", 
                    a.is_parked as "a_park", a.count as "a_count"
            FROM c LEFT JOIN a ON c.id = a.id;
                """)

    query2 = text("""
            SELECT result FROM capture_coarse_result
                """)

    #nested function for formatting results into usage for D3 table
    def formatRes_t(rows, resList):
        cntRes = {}
        resTrack = 0
        overwrite = False
        prev = ""
        result, is_parked, count = "c_result", "c_park", "c_count"
        
        for row in rows:
            rowCntry = row["country"]
            if rowCntry in cntRes:
                if row[is_parked] != None:
                    if row[is_parked]:
                        cntRes[rowCntry][(row[result]+"_park")] = row[count]
                    else:
                        cntRes[rowCntry][(row[result]+"_live")] = row[count]
            else:
                if row[is_parked] != None:
                    if row[is_parked]:
                        cntRes[rowCntry] = {"Country" : rowCntry,
                                            (row[result]+"_park"):row[count]}
                    else:
                        cntRes[rowCntry] = {"Country" : rowCntry,
                                            (row[result]+"_live"):row[count]}

        for res in resList:
            for country in cntRes.keys():
                if (res+"_live") not in cntRes[country]:
                    cntRes[country][res+"_live"] = 0
                if (res+"_park") not in cntRes[country]:
                    cntRes[country][res+"_park"] = 0

        return cntRes
 
    #nested function for formatting results into usage for D3 graph
    def formatRes_b(rows, resList):
        cntRes = {}
        result, is_parked, count = "c_result", "c_park", "c_count"

        for row in rows:
            rowCntry = row["country"]
            if rowCntry in cntRes:
                if row[is_parked] != None:
                    if row[is_parked]:
                        cntRes[rowCntry].append({"name":row[result],
                                                        "value":-row[count]})
                    else:
                        cntRes[rowCntry].append({"name":row[result],
                                                        "value":row[count]})
            else:
                if row[is_parked] != None:
                    if row[is_parked]:
                        cntRes[rowCntry] = [{"name":row[result],
                                                    "value":-row[count]}]
                    else:
                        cntRes[rowCntry] = [{"name":row[result],
                                                    "value":row[count]}]
        for country in cntRes.keys():
            currentRes = []
            for resInCntry in cntRes[country]:
                currentRes.append((list(resInCntry.values()))[0])
            for res in resList:
                if res not in currentRes:
                    (cntRes[country]).append({"name":res, "value":0})
    
        return cntRes

    #nested function for formatting results into usage for D3 graph
    def formatRes_all_b(rows, resList):
        cntRes = []
        result, is_parked, count = "a_result", "a_park", "a_count"

        for row in rows:
            if row[result] == None:
                break

            if row[is_parked] != None:
                if row[is_parked]:
                    cntRes.append({"name":row[result],
                                    "value":-int(row[count])})
                else:
                    cntRes.append({"name":row[result],
                                    "value":int(row[count])})
                
        currentRes = []
        for resInCntry in cntRes:
            currentRes.append(resInCntry["name"])
        for res in resList:
            if res not in currentRes:
                cntRes.append({"name":res, "value":0})
                
        return cntRes
    
    #store requested data in sessions so not constantly requesting from db
    if sourceName in session:
        retVal = session.pop(sourceName,None)
        session[sourceName] = retVal
        return jsonify(result=retVal)
    else:
        allRes = engine.execute(query2)
        resList = []
        for row in allRes:
            resList.append(row["result"])
        result = engine.execute(query)
        cntRes_t = formatRes_t(result, resList)
        result = engine.execute(query)
        cntRes_b = formatRes_b(result, resList)
        result = engine.execute(query)
        allRes_b = formatRes_all_b(result, resList)
        session[sourceName] = [cntRes_t,resList,cntRes_b,allRes_b,sourceName]
        return jsonify(result = [cntRes_t,resList,cntRes_b,allRes_b,
                                    sourceName])

#view function for listing all countries with results data
@app.route("/country_list", methods=['GET', 'POST'])
def country_list():
    """
    query gets list of countries for which there are results
    """
    query = text("""
        SELECT country 
        FROM capture_counts
        GROUP BY country;
            """)
    result = engine.execute(query)
    countryList = []
    for row in result:
        countryList.append(row["country"])
    return jsonify(result=countryList)

#view function for generating results data grouped by country
@app.route("/country_data", methods=['GET', 'POST'])
def country_data():
    countryName = request.json["cname"]
    """
    query gets number of live and parked urls from each source in each result, 
    and also provides overall number of live and parked urls for each result 
    as no URL is tested twice in the same country
    """
    query = text("""
            WITH s AS (
                SELECT source, result, is_parked, count,
                        row_number() OVER (ORDER BY source, result, 
                            is_parked) as "id"
                FROM capture_counts
                WHERE country = '%s'
                GROUP BY source, result, is_parked, count
                ORDER BY source, result, is_parked
            ), a AS (
                SELECT result, is_parked, sum(count) as "count",
                        row_number() OVER (ORDER BY result, is_parked) as "id"
                FROM capture_counts
                WHERE country = '%s'
                GROUP BY result, is_parked
                ORDER BY result, is_parked
            )
            SELECT s.source, s.result as "s_result", s.is_parked as "s_park", 
                    s.count as "s_count", a.result as "a_result", 
                    a.is_parked as "a_park", a.count as "a_count"
            FROM s LEFT JOIN a ON s.id = a.id;
                """ % (countryName, countryName))
    query2 = text("""
            SELECT result FROM capture_coarse_result
                """)

    #nested function for formatting results into usage for D3 table
    def formatRes_t(rows, resList):
        cntRes = {}
        resTrack = 0
        overwrite = False
        prev = ""
        result, is_parked, count = "s_result", "s_park", "s_count"
        
        for row in rows:
            rowSrc = row["source"]
            if "missing" in row["source"]:
                rowSrc = "Source info missing"

            if rowSrc in cntRes:
                if row[is_parked] != None:
                    if row[is_parked]:
                        cntRes[rowSrc][(row[result]+"_park")] = row[count]
                    else:
                        cntRes[rowSrc][(row[result]+"_live")] = row[count]
            else:
                if row[is_parked] != None:
                    if row[is_parked]:
                        cntRes[rowSrc] = {"Source" : rowSrc,
                                            (row[result]+"_park"):row[count]}
                    else:
                        cntRes[rowSrc] = {"Source" : rowSrc,
                                            (row[result]+"_live"):row[count]}

        for res in resList:
            for source in cntRes.keys():
                if (res+"_live") not in cntRes[source]:
                    cntRes[source][res+"_live"] = 0
                if (res+"_park") not in cntRes[source]:
                    cntRes[source][res+"_park"] = 0

        return cntRes
 
    #nested function for formatting results into usage for D3 graphs based on 
    #each URL source
    def formatRes_b(rows, resList):
        cntRes = {}
        result, is_parked, count = "s_result", "s_park", "s_count"

        for row in rows:
            rowSrc = row["source"]
            if "missing" in row["source"]:
                rowSrc = "Source info missing"

            if rowSrc in cntRes:
                if row[is_parked] != None:
                    if row[is_parked]:
                        cntRes[rowSrc].append({"name":row[result],
                                                        "value":-row[count]})
                    else:
                        cntRes[rowSrc].append({"name":row[result],
                                                        "value":row[count]})
            else:
                if row[is_parked] != None:
                    if row[is_parked]:
                        cntRes[rowSrc] = [{"name":row[result],
                                                    "value":-row[count]}]
                    else:
                        cntRes[rowSrc] = [{"name":row[result],
                                                    "value":row[count]}]
        for source in cntRes.keys():
            currentRes = []
            for resInSrc in cntRes[source]:
                currentRes.append((list(resInSrc.values()))[0])
            for res in resList:
                if res not in currentRes:
                    (cntRes[source]).append({"name":res, "value":0})
    
        return cntRes

    #nested function for formatting results into usage for overall D3 graph
    def formatRes_all_b(rows, resList):
        cntRes = []
        result, is_parked, count = "a_result", "a_park", "a_count"

        for row in rows:
            if row[result] == None:
                break

            if row[is_parked] != None:
                if row[is_parked]:
                    cntRes.append({"name":row[result],
                                    "value":-int(row[count])})
                else:
                    cntRes.append({"name":row[result],
                                    "value":int(row[count])})
                
        currentRes = []
        for resInSrc in cntRes:
            currentRes.append(resInSrc["name"])
        for res in resList:
            if res not in currentRes:
                cntRes.append({"name":res, "value":0})
                
        return cntRes

    #store requested data in sessions
    if countryName in session:
        retVal = session.pop(countryName,None)
        session[countryName] = retVal
        return jsonify(result=retVal)
    else:
        allRes = engine.execute(query2)
        resList = []
        for row in allRes:
            resList.append(row["result"])
        result = engine.execute(query)
        cntRes_t = formatRes_t(result, resList)
        result = engine.execute(query)
        cntRes_b = formatRes_b(result, resList)
        result = engine.execute(query)
        allRes_b = formatRes_all_b(result, resList)
        session[countryName] = [cntRes_t,resList,cntRes_b,allRes_b,countryName]
        return jsonify(result = [cntRes_t,resList,cntRes_b,allRes_b,
                                    countryName])

#view function for generating overall analysis of results data
@app.route("/overall_data", methods=['GET', 'POST'])
def overall_data():
    reqType == request.json["toGet"]
    query = text("""
            WITH count_res AS (
                    SELECT source, country, result,
                            sum(sum(count)) OVER (PARTITION BY country, result) as "c_count",
                            sum(sum(count)) OVER (PARTITION BY source, result) as "s_count",
                            sum(sum(count)) OVER (PARTITION BY country) 
                                as "ov_c_count",
                            sum(sum(count)) OVER (PARTITION BY source) 
                                as "ov_s_count"
                    FROM capture_counts
                    GROUP BY source, country, result
                ), avg_res AS (
                    SELECT result, avg(count) as "average_number",
                            row_number() OVER (ORDER BY result) AS "id"
                    FROM capture_counts
                    GROUP BY result
                    ORDER BY result
                ), country_res AS (
                    SELECT country, c_count / ov_c_count as "c_perc"
                    FROM count_res
                    WHERE result = 'ok'
                    GROUP BY country, c_perc, result
                ), country_rank AS (
                    SELECT country, c_perc,
                            rank() OVER (ORDER BY c_perc ASC) as "rank"
                    FROM country_res
                ), source_res AS (
                    SELECT source, s_count / ov_s_count as "s_perc"
                    FROM count_res
                    WHERE result = 'ok'
                    GROUP BY source, s_perc, result
                ), source_rank AS (
                    SELECT source, s_perc,
                            rank() OVER (ORDER BY s_perc ASC) as "rank"
                    FROM source_res
                ), c_rank_ID AS (
                    SELECT country, c_perc, rank, 
                            row_number() OVER (ORDER BY rank) AS "id"
                    FROM country_rank
                ), s_rank_ID AS (
                    SELECT source, s_perc, rank, 
                            row_number() OVER (ORDER BY rank) AS "id"
                    FROM source_rank
                )
            SELECT a.result, a.average_number, c.country, c.c_perc, 
                    c.rank as c_rank, s.source, s.s_perc, s.rank as s_rank
            FROM c_rank_ID c LEFT JOIN s_rank_ID s ON c.id = s.id 
                LEFT JOIN avg_res a ON c.id = a.id;""")
    #looks at average number of URLs for each result
    if (reqType == "avg") and ("avgs" in session):
        retVal = session.pop("avg",None)
        session["avg"] = retVal
        return jsonify(result=retVal)
    #ranks countries by most number of URLs with result "ok"
    elif (reqType == "countries") and ("countries" in session):
        retVal = session.pop("countries",None)
        session["countries"] = retVal
        return jsonify(result=retVal)
    #ranks URL sources by most number of URLs with result "ok"
    elif (reqType == "sources") and ("sources" in session):
        retVal = session.pop("sources",None)
        session["sources"] = retVal
        return jsonify(result=retVal)
    else:
        result = engine.execute(query)
        avgRes = []
        avgLabels = []
        cntRes = []
        cntLabels = []
        srcRes = []
        srcLabels = []
        for row in result:
            if row["result"] != None:
                avgRes.append({"name":row["result"],
                                "value":float(round(row["average_number"],2))})
                avgLabels.append(row["result"])
            if row["s_perc"] != None:
                sPercVal = float(round(row["s_perc"] * 100,2))
                if row["source"] == None:
                    srcRes.append({"name":"Unknown source", "value":sPercVal})
                    srcLabels.append("Unknown source")
                else:
                    srcRes.append({"name":row["source"], "value":sPercVal})
                    srcLabels.append(row["source"])
            if row["country"] != None:
                cPercVal = float(round(row["c_perc"] * 100,2))
                cntRes.append({"name":row["country"], "value":cPercVal})
                cntLabels.append(row["country"])
        if reqType == "avg":
            session["avg"] = [avgRes,avgLabels]
            return jsonify(result=[avgRes,avgLabels])
        elif reqType == "countries":
            session["countries"] = [cntRes,cntLabels]
            return jsonify(result=[cntRes,cntLabels])
        elif reqType == "sources":
            session["sources"] = [srcRes,srcLabels]
            return jsonify(result=[srcRes,srcLabels])

#view function for URL source data page
@app.route("/sour")
def url():
    return render_template("source.html")

#view function for country data page
@app.route("/coun")
def country():
    return render_template("country.html")

#view function for overall source data page
@app.route("/over")
def overall():
    return render_template("overall.html")

#view function for passing on which URL source to request data for
@app.route("/sour_data", methods=['GET', 'POST'])
def source_sel():
    session["sourceData"] = request.json["sname"]
    return jsonify(result=request.json["sname"])

#view function for passing on which country to request data for
@app.route("/coun_data", methods=['GET', 'POST'])
def country_sel():
    session["countryData"] = request.json["cname"]
    return jsonify(result=request.json["cname"])

#view function for passing on which overall analysis to request data for
@app.route("/over_data", methods=['GET', 'POST'])
def overall_sel():
    session["overallData"] = request.json["toGet"][0]
    session["header"] = request.json["toGet"][1]
    session["xLabel"] = request.json["toGet"][2]
    session["yLabel"] = request.json["toGet"][3]
    session["title"] = request.json["toGet"][4]
    retval = session.pop("header",None)
    session["header"] = request.json["toGet"][1]
    return jsonify(result=retval)

#view function for URL source results page
@app.route("/sour_res")
def url_res():
    return render_template("source_res.html")

#view function for country results page
@app.route("/coun_res")
def country_res():
    return render_template("country_res.html")

#view function for overall results page
@app.route("/over_res")
def overall_res():
    return render_template("overall_res.html")

#view function for home results page
@app.route("/")
def index():
    return render_template("index.html")

#makes sessions secure
app.secret_key = os.urandom(24)

if __name__ == '__main__':
    app.run(host='0.0.0.0')