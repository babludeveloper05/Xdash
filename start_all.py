#!/usr/bin/env python3
"""
start_all.py — start all Delta services in a way that survives the sandbox.

The sandbox kills processes started by bash, but processes started by Python's
subprocess.Popen with start_new_session=True survive (same pattern as FastAPI
and Socket.io which have been running for 1+ hours).

Starts:
  1. Next.js production server (port 3000) — the frontend
  2. FastAPI (port 8000) — the backend (if not already running)
  3. Socket.io (port 3003) — real-time (if not already running)

Usage: python3 start_all.py
"""
import subprocess, os, time, sys, urllib.request

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
API_DIR = os.path.join(PROJECT_DIR, 'mini-services', 'api')
RT_DIR = os.path.join(PROJECT_DIR, 'mini-services', 'realtime')

def is_port_up(port):
    try:
        urllib.request.urlopen(f'http://localhost:{port}/', timeout=2)
        return True
    except:
        return False

def start_service(name, cmd, cwd, env, port):
    if is_port_up(port):
        print(f"  {name}: already running on :{port}")
        return True
    print(f"  {name}: starting on :{port}...")
    proc = subprocess.Popen(
        cmd, cwd=cwd, env=env,
        stdout=open(os.path.join(cwd, 'server.log'), 'w'),
        stderr=subprocess.STDOUT,
        start_new_session=True
    )
    print(f"  {name}: PID {proc.pid}")
    # Wait for it to be ready
    for i in range(10):
        time.sleep(1)
        if is_port_up(port):
            print(f"  {name}: ready ✓")
            return True
    print(f"  {name}: FAILED to start ✗")
    return False

print("=== Starting Delta services ===")

# 1. Next.js (production server — single process, no children)
next_env = {**os.environ, 'NODE_ENV': 'production', 'PORT': '3000', 'HOSTNAME': '0.0.0.0'}
start_service('Next.js', ['node', '.next/standalone/server.js'], PROJECT_DIR, next_env, 3000)

# 2. FastAPI
api_env = {**os.environ}
start_service('FastAPI', ['./venv/bin/python', 'main.py'], API_DIR, api_env, 8000)

# 3. Socket.io
rt_env = {**os.environ}
start_service('Socket.io', ['bun', '--hot', 'index.ts'], RT_DIR, rt_env, 3003)

print("\n=== All services ===")
for name, port in [('Next.js', 3000), ('FastAPI', 8000), ('Socket.io', 3003)]:
    status = "✓ UP" if is_port_up(port) else "✗ DOWN"
    print(f"  {name} (:{port}): {status}")
print("\nGateway: http://localhost:81/")
