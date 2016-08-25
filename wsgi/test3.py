import subprocess
def monitor():
    # cmd = ["ssh", "-i", "/home/alexyu0/sshKeys/alexyu0", "tbbscraperentry@laguz.owlfolio.org", "python", "/home/tbbscraperentry/getCollectorStatus.py"]
    # a = subprocess.call(cmd)
    # cmd = ["scp", "-i", "/home/alexyu0/sshKeys/alexyu0", "tbbscraperentry@laguz.owlfolio.org:/home/tbbscraperentry/collectorInfo.txt", "."]
    # b = subprocess.call(cmd)
    cmd = ["sh","getTestedLocales.sh"]
    b = subprocess.call(cmd)
    return [b]