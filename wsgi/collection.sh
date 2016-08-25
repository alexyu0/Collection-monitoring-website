#!/bin/sh
PATH=/usr/local/bin:/usr/local/sbin:/usr/bin:/usr/sbin:/bin:/sbin
export PATH
python tbbscraper/collector/automate-collector/automate_laguz.py locations_sample.txt url_sample_1000.txt cs_automation_test testCaptureResults dbreceiver@kenaz.ece.cmu.edu testAutomateLog INFO speddada@andrew.cmu.edu -q 
