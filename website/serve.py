#!/usr/bin/env python3
"""
Simple HTTP server for local SSIP website development.
Run: python serve.py
Then open: http://localhost:8000
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from functools import partial

PORT = 8000

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP handler with CORS support for local development"""
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()
    
    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {args[0]}")

def main():
    # Change to website directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    handler = CORSRequestHandler
    
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        url = f"http://localhost:{PORT}"
        print("", flush=True)
        print("=" * 60, flush=True)
        print("       SSIP Local Development Server", flush=True)
        print("=" * 60, flush=True)
        print("", flush=True)
        print(f"   Server running at: {url}", flush=True)
        print("", flush=True)
        print("   Press Ctrl+C to stop the server", flush=True)
        print("", flush=True)
        print("=" * 60, flush=True)
        print("", flush=True)
        
        # Open browser automatically
        webbrowser.open(url)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\nServer stopped. Goodbye!")

if __name__ == "__main__":
    main()
