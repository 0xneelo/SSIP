#!/usr/bin/env python3
"""
Sovereign Intent Protocol - Web Server

A simple HTTP server to host the SIP website locally.
Run this script to start the server, then access the site at http://localhost:8080
or via your IP address on your local network.

Usage:
    python server.py [port]
    
    Default port: 8080
"""

import http.server
import socketserver
import socket
import os
import sys
import webbrowser
from functools import partial

# Configuration
DEFAULT_PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))


class QuietHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom HTTP handler with cleaner logging."""
    
    def __init__(self, *args, directory=None, **kwargs):
        super().__init__(*args, directory=directory, **kwargs)
    
    def log_message(self, format, *args):
        """Override to show cleaner log messages."""
        message = format % args
        # Color coding for different request types
        if '200' in message or '304' in message:
            status = '\033[92m✓\033[0m'  # Green
        elif '404' in message:
            status = '\033[91m✗\033[0m'  # Red
        else:
            status = '\033[93m○\033[0m'  # Yellow
        
        print(f"  {status} {message}")
    
    def do_GET(self):
        """Handle GET requests, serving index.html for root."""
        if self.path == '/':
            self.path = '/index.html'
        return super().do_GET()


def get_local_ip():
    """Get the local IP address of the machine."""
    try:
        # Connect to an external address to determine local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def print_banner():
    """Print a nice startup banner."""
    print("\n" + "=" * 60)
    print("""
    ◇ SOVEREIGN INTENT PROTOCOL
    Web Server v1.0
    """)
    print("=" * 60)


def main():
    """Main function to start the server."""
    # Get port from command line or use default
    port = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PORT
    
    # Change to website directory
    os.chdir(DIRECTORY)
    
    # Print banner
    print_banner()
    
    # Get IP addresses
    local_ip = get_local_ip()
    
    # Create handler with directory
    handler = partial(QuietHTTPRequestHandler, directory=DIRECTORY)
    
    # Create server with address reuse
    socketserver.TCPServer.allow_reuse_address = True
    
    try:
        with socketserver.TCPServer(("", port), handler) as httpd:
            print(f"\n  🚀 Server started successfully!\n")
            print(f"  Local:   http://localhost:{port}")
            print(f"  Network: http://{local_ip}:{port}")
            print(f"\n  Share the Network URL to access from other devices")
            print(f"  on your local network.\n")
            print("=" * 60)
            print("\n  Press Ctrl+C to stop the server\n")
            print("  Request Log:")
            print("-" * 60)
            
            # Optionally open browser
            try:
                webbrowser.open(f"http://localhost:{port}")
            except Exception:
                pass
            
            # Start serving
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n\n  👋 Server stopped. Goodbye!")
        print("=" * 60 + "\n")
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"\n  ❌ Error: Port {port} is already in use.")
            print(f"  Try running: python server.py {port + 1}\n")
        else:
            raise


if __name__ == "__main__":
    main()

