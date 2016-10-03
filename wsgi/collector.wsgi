import sys
import os
sys.path.insert(0,os.path.dirname(__file__))
from routes import app
from werkzeug.debug import DebuggedApplication
application = DebuggedApplication(app, True)
