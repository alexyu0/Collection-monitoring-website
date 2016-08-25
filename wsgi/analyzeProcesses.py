import sys
import subprocess

"""
parses logging file and results directory provided in collection.sh to 
determine what is currently running

check for existence of results directory and "running collector" line in log 
file to see if currently collecting urls
    *** TEST TO SEE HOW MANY URLS ARE WRITTEN PER COUNTRY, HAS TO BE ALL FOR METHOD TO WORK ***
    - use "ls" to determine how many urls have been written per country, then 
    compare against the number of countries and number of urls provided as 
    input arguments
    - if all have been written, is complete

if all URLs and all locations complete, report "importing batch to dbreceiver"

if "time to completion" line exists, report "none running"
"""

if __name__ == "__main__":
    # execute only if run as a script
    f = open("current_progress.txt","wb")
    
    cmd = ("sh getTestedLocales.sh")
    subprocess.call(cmd, shell=True)
