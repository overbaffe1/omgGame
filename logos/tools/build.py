import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from concepts import build_all
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))
build_all(os.path.join(ROOT, "png"), os.path.join(ROOT, "svg"))
