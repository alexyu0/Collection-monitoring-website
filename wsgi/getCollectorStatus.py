import os

"""
parses log file to determine what status collector is in
returns names of locale files if in collector status

use dictionary that maps country codes from file to number of locale files
found (if value is 0 then don't report)
"""
if __name__ == "__main__":
    collectorScript = open("collection.sh","r")
    f = open("collectorInfo.txt","wb")
    lineCount = 0
    for line in collectorScript:
        if lineCount == 3:
            argCount = 0
            for arg in line.split():
                if argCount == 2:
                    locations = arg
                elif argCount == 3:
                    urls = arg
                elif argCount == 5:
                    resultsDir = arg
                elif argCount == 7:
                    logFile = arg
                argCount += 1
        lineCount += 1

    fLog = open((logFile + ".log"),"r")
    # fLines = 
    for line in fLog:
        pass

    #otherwise is collecting or importing
    if "Running collector" in line:
        path = os.path.dirname(os.path.abspath(__file__))
        collecting = False
        for item in os.listdir(path):
            if item == resultsDir:
                collecting = True
                break
        if not collecting:
            f.write("not running\n")
        else:
            countryProgress = {}
            maxURLs = 0

            #get total list of locations
            fLocations = open(locations,"r")
            for line in fLocations:
                countryProgress[line.split()[0]] = 0
            #get total number of URLs to test
            fURLs = open(urls,"r")
            for line in fURLs:
                maxURLs += 1

            overallURLs = 0
            overallProgress = maxURLs * len(countryProgress.keys())

            #get current locale/url files that have already been tested
            for root, dirs, files in os.walk(item, topdown=True):
                for name in files:
                    for cc in countryProgress.keys():
                        if cc in name:
                            countryProgress[cc] += 1
                    overallURLs += 1

            for cc in countryProgress.keys():
                countryProgress[cc] = (countryProgress[cc] * 1.0) / maxURLs
            overallProgress = (overallURLs * 1.0) / overallProgress

            if int(overallProgress) == 1:
                f.write("importing\n")
            else:
                f.write("collecting\n")
                for cc in countryProgress.keys():
                    if int(countryProgress[cc]) != 1:
                        f.write(str(cc) + "," + str(countryProgress[cc]))
                        f.write("\n")
                f.write("overall," + str(overallProgress))
    #check if entire process already complete
    elif (line == "\n") or ("Time to completion" in line):
        f.write("not running\n")
    
    f.close()

