"""CLI entry point for EKADHARA detection engine."""
import sys
import json
import time
import os
import argparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from detectors.pipeline import DetectionPipeline, parse_pcap
from simulator.traffic_gen import generate_scenario


VALID_SCENARIOS = ['mixed', 'ddos', 'beaconing', 'port_scan', 'dga', 'exfiltration']


def analyze_pcap(pcap_path, diode_mode=False):
    """Analyze a PCAP file and output JSON results."""
    start = time.time()
    flows, features = parse_pcap(pcap_path, diode_mode=diode_mode)
    print(f"[*] Parsed {len(flows)} flows in {(time.time() - start) * 1000:.1f} ms", file=sys.stderr)
    pipeline = DetectionPipeline(diode_mode=diode_mode)
    results = pipeline.run(flows, features, pcap_file=pcap_path)
    results['wall_time_ms'] = round((time.time() - start) * 1000, 2)
    print(json.dumps(results, indent=2))


def simulate(scenario, duration=60):
    """Generate a scenario, write PCAP to disk, and analyze it."""
    print(f"Running scenario: {scenario} ({duration}s)...", file=sys.stderr)
    pcap_path = generate_scenario(scenario, duration)
    print(f"Generated PCAP: {pcap_path}", file=sys.stderr)

    size = os.path.getsize(pcap_path)
    print(f"Size: {size} bytes", file=sys.stderr)

    print("\n=== FULL DUPLEX ===")
    analyze_pcap(pcap_path, diode_mode=False)


def main():
    parser = argparse.ArgumentParser(description='EKADHARA - Cyber Threat Detection')
    subparsers = parser.add_subparsers(dest='command')

    analyze_parser = subparsers.add_parser('analyze', help='Analyze a PCAP file')
    analyze_parser.add_argument('pcap', help='Path to PCAP file')
    analyze_parser.add_argument('--diode', action='store_true', help='Run in diode mode')

    sim_parser = subparsers.add_parser('simulate', help='Run a traffic scenario')
    sim_parser.add_argument('scenario', choices=VALID_SCENARIOS,
                            help='Traffic scenario to generate')
    sim_parser.add_argument('--duration', type=int, default=60,
                            help='Duration in seconds (default: 60)')

    args = parser.parse_args()

    if args.command == 'analyze':
        analyze_pcap(args.pcap, diode_mode=args.diode)
    elif args.command == 'simulate':
        simulate(args.scenario, duration=args.duration)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == '__main__':
    main()
