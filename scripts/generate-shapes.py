#!/usr/bin/env python3
"""
Generate SHACL shapes from OWL ontology using owl2shacl rules.

This script uses pyshacl to apply SHACL inference rules from Sparna's owl2shacl
project to convert the volunteer profile OWL ontology into SHACL shapes.

Prerequisites:
    pip3 install rdflib pyshacl requests

Usage:
    python3 scripts/generate-shapes.py
"""

import os
import sys
from pathlib import Path

try:
    from rdflib import Graph, Namespace, RDF, RDFS, OWL, XSD
    from rdflib.namespace import SH
    import requests
except ImportError as e:
    print(f"Error: Missing required package - {e}")
    print("\nPlease install the required packages:")
    print("  pip3 install rdflib pyshacl requests")
    sys.exit(1)

# Define paths
SCRIPT_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = SCRIPT_DIR.parent
ONTOLOGY_FILE = PROJECT_ROOT / "src" / "ontology" / "volunteer-profile.ttl"
OUTPUT_FILE = PROJECT_ROOT / "src" / "shapes" / "volunteer-profile-shapes-generated.ttl"
RULES_URL = "https://raw.githubusercontent.com/sparna-git/owl2shacl/refs/heads/main/owl2sh-closed.ttl"
RULES_CACHE = SCRIPT_DIR / ".owl2sh-closed.ttl"

# Namespaces
VP = Namespace("https://id.volunteeringdata.io/volunteer-profile/")
VPS = Namespace("https://id.volunteeringdata.io/volunteer-profile/shapes/")
VOLUNTEERING = Namespace("https://id.volunteeringdata.io/schema/")


def download_rules():
    """Download owl2shacl rules if not cached."""
    if RULES_CACHE.exists():
        print("✓ Using cached owl2shacl rules")
        return RULES_CACHE.read_text()
    
    print("Downloading owl2shacl rules...")
    response = requests.get(RULES_URL)
    response.raise_for_status()
    RULES_CACHE.write_text(response.text)
    print("✓ Rules downloaded")
    return response.text


def apply_shacl_rules_with_pyshacl(ontology_graph, rules_graph):
    """Apply SHACL rules using pyshacl inference."""
    try:
        from pyshacl import validate
        
        # pyshacl can apply SHACL rules for inference
        # We need to run inference with the rules as shapes
        conforms, results_graph, results_text = validate(
            ontology_graph,
            shacl_graph=rules_graph,
            inference='rdfs',
            advanced=True,
            inplace=True
        )
        
        return ontology_graph
    except ImportError:
        print("Warning: pyshacl not available, using manual transformation")
        return None


def transform_owl_to_shacl(ontology_graph):
    """
    Transform OWL ontology to SHACL shapes manually.
    
    This is a simplified implementation that handles the common OWL patterns
    found in the volunteer profile ontology.
    """
    shapes_graph = Graph()
    
    # Bind namespaces
    shapes_graph.bind("sh", SH)
    shapes_graph.bind("vp", VP)
    shapes_graph.bind("vps", VPS)
    shapes_graph.bind("volunteering", VOLUNTEERING)
    shapes_graph.bind("rdf", RDF)
    shapes_graph.bind("rdfs", RDFS)
    shapes_graph.bind("xsd", XSD)
    shapes_graph.bind("owl", OWL)
    
    # Add header comment
    shapes_graph.add((
        VPS[""],
        RDFS.comment,
        "Auto-generated SHACL shapes from volunteer-profile.ttl using owl2shacl rules"
    ))
    
    # Find all OWL classes and create NodeShapes
    for owl_class in ontology_graph.subjects(RDF.type, OWL.Class):
        if str(owl_class).startswith(str(VP)):
            create_node_shape(ontology_graph, shapes_graph, owl_class)
    
    return shapes_graph


def create_node_shape(ontology_graph, shapes_graph, owl_class):
    """Create a NodeShape for an OWL class."""
    # Create shape URI based on class local name
    class_local = str(owl_class).split("/")[-1]
    shape_uri = VPS[f"{class_local}Shape"]
    
    # Add NodeShape declaration
    shapes_graph.add((shape_uri, RDF.type, SH.NodeShape))
    shapes_graph.add((shape_uri, SH.targetClass, owl_class))
    shapes_graph.add((shape_uri, SH.closed, True))
    
    # Copy label and comment
    for label in ontology_graph.objects(owl_class, RDFS.label):
        shapes_graph.add((shape_uri, RDFS.label, label))
    
    for comment in ontology_graph.objects(owl_class, RDFS.comment):
        shapes_graph.add((shape_uri, RDFS.comment, comment))
    
    # Find properties with this class as domain
    add_property_shapes_from_domain(ontology_graph, shapes_graph, shape_uri, owl_class)
    
    # Add ignoredProperties for rdf:type
    shapes_graph.add((shape_uri, SH.ignoredProperties, RDF.type))


def add_property_shapes_from_domain(ontology_graph, shapes_graph, shape_uri, domain_class):
    """Add property shapes for properties with the given domain."""
    
    # Find object properties with this domain
    for prop in ontology_graph.subjects(RDF.type, OWL.ObjectProperty):
        for domain in ontology_graph.objects(prop, RDFS.domain):
            if domain == domain_class:
                create_property_shape(ontology_graph, shapes_graph, shape_uri, prop, is_datatype=False)
    
    # Find datatype properties with this domain
    for prop in ontology_graph.subjects(RDF.type, OWL.DatatypeProperty):
        for domain in ontology_graph.objects(prop, RDFS.domain):
            if domain == domain_class:
                create_property_shape(ontology_graph, shapes_graph, shape_uri, prop, is_datatype=True)


def create_property_shape(ontology_graph, shapes_graph, node_shape_uri, prop, is_datatype=False):
    """Create a property shape within a node shape."""
    from rdflib import BNode
    
    prop_shape = BNode()
    shapes_graph.add((node_shape_uri, SH.property, prop_shape))
    shapes_graph.add((prop_shape, RDF.type, SH.PropertyShape))
    shapes_graph.add((prop_shape, SH.path, prop))
    
    # Get range and add appropriate constraint
    for range_class in ontology_graph.objects(prop, RDFS.range):
        if is_datatype or str(range_class).startswith(str(XSD)):
            shapes_graph.add((prop_shape, SH.datatype, range_class))
        else:
            shapes_graph.add((prop_shape, SH["class"], range_class))
    
    # Add name from property label
    for label in ontology_graph.objects(prop, RDFS.label):
        shapes_graph.add((prop_shape, SH.name, label))
    
    # Add description from property comment
    for comment in ontology_graph.objects(prop, RDFS.comment):
        shapes_graph.add((prop_shape, SH.description, comment))


def main():
    """Main function to generate SHACL shapes."""
    print("========================================")
    print("OWL to SHACL Shape Generator (Python)")
    print("========================================")
    print()
    
    # Check ontology file exists
    if not ONTOLOGY_FILE.exists():
        print(f"Error: Ontology file not found at {ONTOLOGY_FILE}")
        sys.exit(1)
    print(f"✓ Found ontology: {ONTOLOGY_FILE}")
    
    # Download rules
    rules_content = download_rules()
    
    # Load ontology
    print("Loading ontology...")
    ontology_graph = Graph()
    ontology_graph.parse(str(ONTOLOGY_FILE), format="turtle")
    print(f"✓ Loaded {len(ontology_graph)} triples from ontology")
    
    # Load rules
    print("Loading owl2shacl rules...")
    rules_graph = Graph()
    rules_graph.parse(str(RULES_CACHE), format="turtle")
    print(f"✓ Loaded {len(rules_graph)} triples from rules")
    
    # Try pyshacl first, fall back to manual transformation
    print()
    print("Generating SHACL shapes...")
    
    result_graph = apply_shacl_rules_with_pyshacl(ontology_graph, rules_graph)
    
    if result_graph is None:
        print("Using manual OWL to SHACL transformation...")
        result_graph = transform_owl_to_shacl(ontology_graph)
    
    # Extract SHACL shapes from result
    shapes_graph = Graph()
    shapes_graph.bind("sh", SH)
    shapes_graph.bind("vp", VP)
    shapes_graph.bind("vps", VPS)
    shapes_graph.bind("volunteering", VOLUNTEERING)
    shapes_graph.bind("rdf", RDF)
    shapes_graph.bind("rdfs", RDFS)
    shapes_graph.bind("xsd", XSD)
    
    # Copy SHACL-related triples
    for s, p, o in result_graph:
        # Include NodeShapes, PropertyShapes, and related triples
        if (p == RDF.type and o in (SH.NodeShape, SH.PropertyShape)) or \
           str(p).startswith(str(SH)) or \
           (isinstance(s, Namespace) and str(s).startswith(str(VPS))):
            shapes_graph.add((s, p, o))
    
    # If we got shapes, save them
    if len(shapes_graph) > 0:
        shapes_output = result_graph.serialize(format="turtle")
    else:
        # Fall back to manual transformation
        shapes_graph = transform_owl_to_shacl(ontology_graph)
        shapes_output = shapes_graph.serialize(format="turtle")
    
    # Write output
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(shapes_output)
    
    print()
    print(f"✓ SHACL shapes generated successfully!")
    print(f"Output: {OUTPUT_FILE}")
    print(f"Total triples: {len(shapes_graph)}")


if __name__ == "__main__":
    main()
