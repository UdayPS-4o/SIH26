import argparse
import time
import sys
from generator import TrafficGenerator, Flow


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Network Traffic Simulator for Cyber Threat Detection (SIH26-26145)",
    )
    parser.add_argument(
        "--duration",
        type=float,
        default=10.0,
        help="Duration of simulation in seconds (default: 10.0)",
    )
    parser.add_argument(
        "--rate",
        type=int,
        default=1000,
        help="Average flows per second (default: 1000)",
    )
    parser.add_argument(
        "--attack-rate",
        type=float,
        default=0.05,
        help="Probability of an attack flow (default: 0.05 = 5%%)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Output file path (.csv or .json)",
    )
    parser.add_argument(
        "--format",
        choices=["csv", "json"],
        default="csv",
        help="Output format when --output is given (default: csv)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Random seed for reproducibility",
    )
    args = parser.parse_args()

    if args.seed is not None:
        import random

        random.seed(args.seed)

    benign_ratio = max(0.0, min(1.0, 1.0 - args.attack_rate))
    gen = TrafficGenerator(benign_ratio=benign_ratio)

    print(f"Generating traffic for {args.duration}s at ~{args.rate} flows/sec ...")
    print(f"Attack probability : {args.attack_rate * 100:.1f}%")

    start = time.time()
    flows = []

    while time.time() - start < args.duration:
        burst = gen.generate_traffic_burst(duration=1.0, flows_per_sec=args.rate)
        flows.extend(burst)
        print(f"\rGenerated {len(flows)} flows ...", end="", flush=True)

    elapsed = time.time() - start
    print(f"\n\nTotal flows generated : {len(flows)}")

    stats = gen.generate_stats(flows)
    print(f"  Benign  : {stats['benign_count']}")
    print(f"  Attack  : {stats['attack_count']}")
    print(f"  Types   : {stats['attack_types']}")
    print(f"Elapsed  : {elapsed:.2f}s")
    print(f"Rate     : {len(flows) / elapsed:.0f} flows/sec")

    if args.output:
        if args.format == "csv":
            gen.export_csv(flows, args.output)
        else:
            gen.export_json(flows, args.output)
        print(f"Output written to: {args.output}")


if __name__ == "__main__":
    main()
