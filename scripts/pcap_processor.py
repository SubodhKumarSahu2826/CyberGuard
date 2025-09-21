#!/usr/bin/env python3
"""
PCAP File Processor for Cyber Attack Detection
Extracts HTTP URLs from PCAP files and processes them for analysis
"""

import os
import sys
import json
import asyncio
from datetime import datetime
from typing import List, Dict, Optional, Tuple
import logging

# Third-party imports (would need to be installed)
try:
    import scapy.all as scapy
    from scapy.layers.http import HTTPRequest, HTTPResponse
    from scapy.layers.inet import IP, TCP
    SCAPY_AVAILABLE = True
except ImportError:
    SCAPY_AVAILABLE = False
    print("Warning: Scapy not available. Install with: pip install scapy")

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PCAPProcessor:
    def __init__(self):
        self.extracted_urls = []
        self.processed_packets = 0
        self.http_packets = 0
        
    def process_pcap_file(self, pcap_path: str) -> Dict:
        """Process a PCAP file and extract HTTP URLs"""
        if not SCAPY_AVAILABLE:
            return self._mock_pcap_processing(pcap_path)
        
        try:
            logger.info(f"Processing PCAP file: {pcap_path}")
            start_time = datetime.now()
            
            # Read PCAP file
            packets = scapy.rdpcap(pcap_path)
            self.processed_packets = len(packets)
            
            logger.info(f"Loaded {self.processed_packets} packets")
            
            # Process each packet
            for packet in packets:
                self._process_packet(packet)
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            result = {
                'pcap_file': pcap_path,
                'total_packets': self.processed_packets,
                'http_packets': self.http_packets,
                'extracted_urls': self.extracted_urls,
                'processing_time_seconds': processing_time,
                'timestamp': datetime.now().isoformat()
            }
            
            logger.info(f"Extracted {len(self.extracted_urls)} URLs from {self.http_packets} HTTP packets")
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing PCAP file: {e}")
            return {
                'error': str(e),
                'pcap_file': pcap_path,
                'timestamp': datetime.now().isoformat()
            }
    
    def _process_packet(self, packet):
        """Process individual packet to extract HTTP information"""
        try:
            # Check if packet has HTTP layer
            if packet.haslayer(HTTPRequest):
                self.http_packets += 1
                self._extract_http_request(packet)
                
        except Exception as e:
            logger.debug(f"Error processing packet: {e}")
    
    def _extract_http_request(self, packet):
        """Extract HTTP request information"""
        try:
            http_layer = packet[HTTPRequest]
            ip_layer = packet[IP] if packet.haslayer(IP) else None
            
            # Extract basic information
            method = http_layer.Method.decode('utf-8') if http_layer.Method else 'GET'
            host = http_layer.Host.decode('utf-8') if http_layer.Host else ''
            path = http_layer.Path.decode('utf-8') if http_layer.Path else '/'
            
            # Construct full URL
            protocol = 'https' if packet.haslayer(TCP) and packet[TCP].dport == 443 else 'http'
            url = f"{protocol}://{host}{path}"
            
            # Extract headers
            headers = {}
            if hasattr(http_layer, 'User_Agent') and http_layer.User_Agent:
                headers['User-Agent'] = http_layer.User_Agent.decode('utf-8')
            if hasattr(http_layer, 'Referer') and http_layer.Referer:
                headers['Referer'] = http_layer.Referer.decode('utf-8')
            
            # Extract source IP
            source_ip = ip_layer.src if ip_layer else None
            
            # Get timestamp
            timestamp = datetime.fromtimestamp(float(packet.time)).isoformat()
            
            url_info = {
                'url': url,
                'method': method,
                'host': host,
                'path': path,
                'headers': headers,
                'source_ip': source_ip,
                'timestamp': timestamp,
                'packet_info': {
                    'protocol': protocol,
                    'src_port': packet[TCP].sport if packet.haslayer(TCP) else None,
                    'dst_port': packet[TCP].dport if packet.haslayer(TCP) else None
                }
            }
            
            self.extracted_urls.append(url_info)
            
        except Exception as e:
            logger.debug(f"Error extracting HTTP request: {e}")
    
    def _mock_pcap_processing(self, pcap_path: str) -> Dict:
        """Mock PCAP processing when Scapy is not available"""
        logger.info("Using mock PCAP processing (Scapy not available)")
        
        # Generate mock extracted URLs for demonstration
        mock_urls = [
            {
                'url': 'http://example.com/login?user=admin&pass=123',
                'method': 'POST',
                'host': 'example.com',
                'path': '/login',
                'headers': {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'},
                'source_ip': '192.168.1.100',
                'timestamp': datetime.now().isoformat(),
                'packet_info': {'protocol': 'http', 'src_port': 54321, 'dst_port': 80}
            },
            {
                'url': 'https://vulnerable.com/search?q=<script>alert(1)</script>',
                'method': 'GET',
                'host': 'vulnerable.com',
                'path': '/search',
                'headers': {'User-Agent': 'curl/7.68.0'},
                'source_ip': '10.0.0.50',
                'timestamp': datetime.now().isoformat(),
                'packet_info': {'protocol': 'https', 'src_port': 45678, 'dst_port': 443}
            },
            {
                'url': 'http://target.com/file.php?path=../../../etc/passwd',
                'method': 'GET',
                'host': 'target.com',
                'path': '/file.php',
                'headers': {'User-Agent': 'python-requests/2.25.1'},
                'source_ip': '203.0.113.45',
                'timestamp': datetime.now().isoformat(),
                'packet_info': {'protocol': 'http', 'src_port': 12345, 'dst_port': 80}
            }
        ]
        
        return {
            'pcap_file': pcap_path,
            'total_packets': 1500,
            'http_packets': 45,
            'extracted_urls': mock_urls,
            'processing_time_seconds': 2.5,
            'timestamp': datetime.now().isoformat(),
            'note': 'Mock data - install Scapy for real PCAP processing'
        }
    
    def save_results(self, results: Dict, output_path: str):
        """Save processing results to JSON file"""
        try:
            with open(output_path, 'w') as f:
                json.dump(results, f, indent=2)
            logger.info(f"Results saved to {output_path}")
        except Exception as e:
            logger.error(f"Error saving results: {e}")

def main():
    """Main PCAP processing function"""
    if len(sys.argv) < 2:
        print("Usage: python pcap_processor.py <pcap_file_path>")
        sys.exit(1)
    
    pcap_path = sys.argv[1]
    
    if not os.path.exists(pcap_path):
        print(f"Error: PCAP file not found: {pcap_path}")
        sys.exit(1)
    
    processor = PCAPProcessor()
    results = processor.process_pcap_file(pcap_path)
    
    # Print results
    if 'error' not in results:
        print(f"Successfully processed PCAP file:")
        print(f"  Total packets: {results['total_packets']}")
        print(f"  HTTP packets: {results['http_packets']}")
        print(f"  Extracted URLs: {len(results['extracted_urls'])}")
        print(f"  Processing time: {results['processing_time_seconds']:.2f}s")
        
        # Save results
        output_path = pcap_path.replace('.pcap', '_results.json').replace('.pcapng', '_results.json')
        processor.save_results(results, output_path)
        
        # Print first few URLs
        if results['extracted_urls']:
            print("\nFirst few extracted URLs:")
            for i, url_info in enumerate(results['extracted_urls'][:5]):
                print(f"  {i+1}. {url_info['url']} ({url_info['method']}) from {url_info['source_ip']}")
    else:
        print(f"Error processing PCAP file: {results['error']}")

if __name__ == "__main__":
    main()
