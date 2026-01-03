#!/usr/bin/env node
/**
 * Generate SHACL shapes from OWL ontology using owl2shacl-style SPARQL rules.
 * 
 * This script applies SPARQL CONSTRUCT queries (based on owl2shacl patterns)
 * to the volunteer profile ontology to generate SHACL shapes.
 * 
 * Uses:
 * - rdf-dereference-store for parsing Turtle files
 * - Comunica for executing SPARQL CONSTRUCT queries
 * - shaclc-write for serializing to SHACL Compact Syntax
 * 
 * Usage:
 *   node scripts/generate-shapes.js
 * 
 * Or via npm:
 *   npm run generate:shapes:node
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { DataFactory, Store } = require('n3');
const { namedNode, literal } = DataFactory;

// Paths
const PROJECT_ROOT = path.resolve(__dirname, '..');
const ONTOLOGY_FILE = path.join(PROJECT_ROOT, 'src', 'ontology', 'volunteer-profile.ttl');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'src', 'shapes', 'volunteer-profile-shapes-generated.shaclc');
const RULES_URL = 'https://raw.githubusercontent.com/sparna-git/owl2shacl/refs/heads/main/owl2sh-closed.ttl';
const RULES_CACHE = path.join(__dirname, '.owl2sh-closed.ttl');

// Namespaces
const NS = {
    vp: 'https://id.volunteeringdata.io/volunteer-profile/',
    vps: 'https://id.volunteeringdata.io/volunteer-profile/shapes/',
    volunteering: 'https://id.volunteeringdata.io/schema/',
    sh: 'http://www.w3.org/ns/shacl#',
    rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    owl: 'http://www.w3.org/2002/07/owl#',
    xsd: 'http://www.w3.org/2001/XMLSchema#',
    dc: 'http://purl.org/dc/terms/',
};

// SPARQL Prefixes
const SPARQL_PREFIXES = `
PREFIX vp: <${NS.vp}>
PREFIX vps: <${NS.vps}>
PREFIX volunteering: <${NS.volunteering}>
PREFIX sh: <${NS.sh}>
PREFIX rdf: <${NS.rdf}>
PREFIX rdfs: <${NS.rdfs}>
PREFIX owl: <${NS.owl}>
PREFIX xsd: <${NS.xsd}>
`;

/**
 * Download file from URL
 */
function downloadFile(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                downloadFile(response.headers.location).then(resolve).catch(reject);
                return;
            }
            
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => resolve(data));
            response.on('error', reject);
        }).on('error', reject);
    });
}

/**
 * SPARQL CONSTRUCT rules derived from owl2shacl patterns.
 * These are simplified versions that work with standard SPARQL.
 * Reference: https://github.com/sparna-git/owl2shacl
 * 
 * The original owl2shacl rules use custom SPARQL functions (sh:SPARQLFunction)
 * which aren't supported by standard SPARQL engines. These rules implement
 * the same transformations using standard SPARQL.
 */
const OWL2SHACL_RULES = [
    {
        name: "Create NodeShapes from OWL Classes",
        order: 1,
        construct: `
CONSTRUCT {
    ?shapeUri a sh:NodeShape .
    ?shapeUri sh:targetClass ?class .
    ?shapeUri rdfs:label ?label .
    ?shapeUri rdfs:comment ?comment .
}
WHERE {
    ?class a owl:Class .
    FILTER(isIRI(?class))
    FILTER(STRSTARTS(STR(?class), "${NS.vp}"))
    
    BIND(IRI(CONCAT("${NS.vps}", STRAFTER(STR(?class), "${NS.vp}"), "Shape")) AS ?shapeUri)
    
    OPTIONAL { ?class rdfs:label ?label }
    OPTIONAL { ?class rdfs:comment ?comment }
}
`
    },
    {
        name: "Close NodeShapes",
        order: 2,
        construct: `
CONSTRUCT {
    ?shape sh:closed true .
}
WHERE {
    ?shape a sh:NodeShape .
    ?shape sh:targetClass ?class .
    FILTER(STRSTARTS(STR(?class), "${NS.vp}"))
}
`
    },
    {
        name: "Create PropertyShapes from rdfs:domain",
        order: 3,
        construct: `
CONSTRUCT {
    ?shapeUri sh:property ?propertyShapeUri .
    ?propertyShapeUri sh:path ?property .
    ?propertyShapeUri sh:name ?label .
    ?propertyShapeUri sh:description ?comment .
}
WHERE {
    ?property rdfs:domain ?class .
    ?class a owl:Class .
    FILTER(isIRI(?class))
    FILTER(STRSTARTS(STR(?class), "${NS.vp}"))
    
    BIND(IRI(CONCAT("${NS.vps}", STRAFTER(STR(?class), "${NS.vp}"), "Shape")) AS ?shapeUri)
    
    # Generate a property shape URI based on class shape and property
    BIND(
        IRI(CONCAT(
            "${NS.vps}",
            STRAFTER(STR(?class), "${NS.vp}"),
            "Shape-",
            IF(CONTAINS(STR(?property), "#"),
               STRAFTER(STR(?property), "#"),
               REPLACE(REPLACE(STR(?property), "/", "_"), ":", "_")
            )
        ))
    AS ?propertyShapeUri)
    
    OPTIONAL { ?property rdfs:label ?label }
    OPTIONAL { ?property rdfs:comment ?comment }
}
`
    },
    {
        name: "Add sh:class from rdfs:range (Object Properties)",
        order: 4,
        construct: `
CONSTRUCT {
    ?propertyShapeUri sh:class ?range .
}
WHERE {
    ?property a owl:ObjectProperty .
    ?property rdfs:domain ?class .
    ?property rdfs:range ?range .
    FILTER(isIRI(?class))
    FILTER(isIRI(?range))
    FILTER(STRSTARTS(STR(?class), "${NS.vp}"))
    
    BIND(
        IRI(CONCAT(
            "${NS.vps}",
            STRAFTER(STR(?class), "${NS.vp}"),
            "Shape-",
            IF(CONTAINS(STR(?property), "#"),
               STRAFTER(STR(?property), "#"),
               REPLACE(REPLACE(STR(?property), "/", "_"), ":", "_")
            )
        ))
    AS ?propertyShapeUri)
}
`
    },
    {
        name: "Add sh:datatype from rdfs:range (Datatype Properties)",
        order: 5,
        construct: `
CONSTRUCT {
    ?propertyShapeUri sh:datatype ?range .
}
WHERE {
    ?property a owl:DatatypeProperty .
    ?property rdfs:domain ?class .
    ?property rdfs:range ?range .
    FILTER(isIRI(?class))
    FILTER(isIRI(?range))
    FILTER(STRSTARTS(STR(?class), "${NS.vp}"))
    
    BIND(
        IRI(CONCAT(
            "${NS.vps}",
            STRAFTER(STR(?class), "${NS.vp}"),
            "Shape-",
            IF(CONTAINS(STR(?property), "#"),
               STRAFTER(STR(?property), "#"),
               REPLACE(REPLACE(STR(?property), "/", "_"), ":", "_")
            )
        ))
    AS ?propertyShapeUri)
}
`
    },
    {
        name: "Add sh:maxCount 1 for owl:FunctionalProperty",
        order: 6,
        construct: `
CONSTRUCT {
    ?propertyShapeUri sh:maxCount 1 .
}
WHERE {
    ?property a owl:FunctionalProperty .
    ?property rdfs:domain ?class .
    FILTER(isIRI(?class))
    FILTER(STRSTARTS(STR(?class), "${NS.vp}"))
    
    BIND(
        IRI(CONCAT(
            "${NS.vps}",
            STRAFTER(STR(?class), "${NS.vp}"),
            "Shape-",
            IF(CONTAINS(STR(?property), "#"),
               STRAFTER(STR(?property), "#"),
               REPLACE(REPLACE(STR(?property), "/", "_"), ":", "_")
            )
        ))
    AS ?propertyShapeUri)
}
`
    },
];

/**
 * Execute a SPARQL CONSTRUCT query against the data store
 */
async function executeConstruct(engine, store, query) {
    const fullQuery = SPARQL_PREFIXES + query;
    
    try {
        const quadStream = await engine.queryQuads(fullQuery, {
            sources: [store]
        });
        return await quadStream.toArray();
    } catch (err) {
        console.warn(`  Warning: Query failed - ${err.message}`);
        return [];
    }
}

/**
 * Main function
 */
async function main() {
    // Dynamic imports for ESM modules
    const { parse } = await import('rdf-dereference-store');
    const { write } = await import('shaclc-write');
    const { QueryEngine } = await import('@comunica/query-sparql');
    
    console.log('========================================');
    console.log('OWL to SHACL Shape Generator (Node.js)');
    console.log('Using owl2shacl-style SPARQL Rules');
    console.log('========================================');
    console.log('');

    // Check ontology file exists
    if (!fs.existsSync(ONTOLOGY_FILE)) {
        console.error(`Error: Ontology file not found at ${ONTOLOGY_FILE}`);
        process.exit(1);
    }
    console.log(`✓ Found ontology: ${ONTOLOGY_FILE}`);

    // Download/cache reference rules (for documentation purposes)
    try {
        if (!fs.existsSync(RULES_CACHE)) {
            console.log('Downloading owl2shacl rules (for reference)...');
            const rulesContent = await downloadFile(RULES_URL);
            fs.writeFileSync(RULES_CACHE, rulesContent);
            console.log('✓ Reference rules cached');
        } else {
            console.log('✓ Reference owl2shacl rules available');
        }
    } catch (err) {
        console.warn('Warning: Could not cache reference rules:', err.message);
    }

    // Parse ontology using rdf-dereference-store
    console.log('Loading ontology...');
    const ontologyContent = fs.readFileSync(ONTOLOGY_FILE, 'utf-8');
    const { store: ontologyStore } = await parse(ontologyContent, { contentType: 'text/turtle' });
    console.log(`✓ Parsed ${ontologyStore.size} ontology triples`);

    // Create a working store with ontology data
    const workingStore = new Store();
    for (const q of ontologyStore.getQuads()) {
        workingStore.add(q);
    }

    // Create Comunica query engine
    const engine = new QueryEngine();
    
    // Sort rules by order
    const sortedRules = [...OWL2SHACL_RULES].sort((a, b) => a.order - b.order);
    
    console.log('');
    console.log(`Applying ${sortedRules.length} owl2shacl-style SPARQL rules...`);
    
    const allInferredQuads = [];
    
    // Apply rules iteratively until no new quads are generated
    let iteration = 0;
    const maxIterations = 5;
    
    while (iteration < maxIterations) {
        iteration++;
        let totalNewQuads = 0;
        
        console.log(`  Iteration ${iteration}:`);
        
        for (const rule of sortedRules) {
            const newQuads = await executeConstruct(engine, workingStore, rule.construct);
            
            let addedCount = 0;
            for (const q of newQuads) {
                const existing = workingStore.getQuads(q.subject, q.predicate, q.object, q.graph);
                if (existing.length === 0) {
                    workingStore.add(q);
                    allInferredQuads.push(q);
                    addedCount++;
                }
            }
            
            if (addedCount > 0) {
                console.log(`    ${rule.name}: +${addedCount} quads`);
                totalNewQuads += addedCount;
            }
        }
        
        if (totalNewQuads === 0) {
            console.log(`    No new quads generated, stopping.`);
            break;
        }
    }
    
    console.log(`✓ Rule application complete`);
    console.log(`✓ Total inferred quads: ${allInferredQuads.length}`);

    if (allInferredQuads.length === 0) {
        console.error('Error: No shapes were generated. Check ontology structure.');
        process.exit(1);
    }

    // Serialize to SHACL Compact Syntax using shaclc-write
    console.log('');
    console.log('Serializing to SHACL Compact Syntax...');
    const { text } = await write(allInferredQuads, {
        prefixes: {
            sh: NS.sh,
            vp: NS.vp,
            vps: NS.vps,
            volunteering: NS.volunteering,
            rdf: NS.rdf,
            rdfs: NS.rdfs,
            xsd: NS.xsd,
            owl: NS.owl,
        },
        extendedSyntax: true,
        errorOnUnused: false,
        requireBase: false,
    });

    // Write output
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, text);

    console.log('');
    console.log('✓ SHACL shapes generated successfully!');
    console.log(`Output: ${OUTPUT_FILE}`);
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
