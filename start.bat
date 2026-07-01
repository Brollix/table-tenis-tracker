@echo off
:: Quick launcher — install deps if needed, then open the GUI
pip show google-generativeai >nul 2>&1 || pip install -r requirements.txt
start pythonw gui.py
