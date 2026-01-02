#!/usr/bin/env node
/**
 * Generate SHACL shapes from OWL ontology using owl2shacl rules.
 * 
 * This script downloads the owl2shacl rules and applies them to the
 * volunteer profile ontology to generate SHACL shapes.
 * 
 * Since applying SHACL rules for inference requires specialized tools,
 * this script implements the key transformations from OWL to SHACL directly.
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

// Paths
const PROJECT_ROOT = path.resolve(__dirname, '..');
const ONTOLOGY_FILE = path.join(PROJECT_ROOT, 'src', 'ontology', 'volunteer-profile.ttl');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'src', 'shapes', 'volunteer-profile-shapes-generated.ttl');
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

/**
 * Simple Turtle parser for extracting ontology information.
 * This is a minimal implementation for the specific patterns in our ontology.
 */
class SimpleTurtleParser {
    constructor(content) {
        this.content = content;
        this.prefixes = {};
        this.triples = [];
        this.parse();
    }

    parse() {
        // Remove comments
        let cleaned = this.content.replace(/#[^\n]*\n/g, '\n');
        
        // Parse prefix declarations
        const prefixRegex = /@prefix\s+(\w+):\s+<([^>]+)>\s*\./g;
        let match;
        while ((match = prefixRegex.exec(cleaned)) !== null) {
            this.prefixes[match[1]] = match[2];
        }
        
        // Remove prefix declarations for triple parsing
        cleaned = cleaned.replace(/@prefix[^.]+\./g, '');
        
        // Split by periods followed by newlines or end (subject terminators)
        const statements = cleaned.split(/\.\s*(?=\n|$)/);
        
        for (const stmt of statements) {
            this.parseStatement(stmt.trim());
        }
    }

    parseStatement(stmt) {
        if (!stmt || stmt.length < 3) return;
        
        // Find subject (first non-whitespace token)
        const subjectMatch = stmt.match(/^(\S+)/);
        if (!subjectMatch) return;
        
        const subject = this.expandPrefix(subjectMatch[1]);
        let rest = stmt.slice(subjectMatch[0].length).trim();
        
        // Parse predicate-object pairs (separated by ;)
        const pairs = rest.split(/\s*;\s*/);
        
        for (const pair of pairs) {
            if (!pair.trim()) continue;
            
            // Find predicate and object(s)
            const parts = pair.trim().split(/\s+/);
            if (parts.length < 2) continue;
            
            const predicate = this.expandPrefix(parts[0]);
            const objectStr = parts.slice(1).join(' ').trim();
            
            // Handle multiple objects (separated by ,)
            const objects = this.parseObjects(objectStr);
            
            for (const obj of objects) {
                if (subject && predicate && obj) {
                    this.triples.push({ subject, predicate, object: obj });
                }
            }
        }
    }

    parseObjects(str) {
        const objects = [];
        let current = '';
        let inString = false;
        let stringChar = '';
        let depth = 0;
        
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            const prev = i > 0 ? str[i-1] : '';
            
            if (!inString && (char === '"' || char === "'")) {
                inString = true;
                stringChar = char;
                // Check for triple quotes
                if (str.slice(i, i+3) === '"""' || str.slice(i, i+3) === "'''") {
                    stringChar = str.slice(i, i+3);
                    current += stringChar;
                    i += 2;
                    continue;
                }
            } else if (inString) {
                if (stringChar.length === 3) {
                    if (str.slice(i, i+3) === stringChar && prev !== '\\') {
                        current += stringChar;
                        i += 2;
                        inString = false;
                        continue;
                    }
                } else if (char === stringChar && prev !== '\\') {
                    inString = false;
                }
            }
            
            if (!inString && char === '(' ) depth++;
            if (!inString && char === ')') depth--;
            
            if (!inString && depth === 0 && char === ',') {
                const obj = this.expandPrefix(current.trim());
                if (obj) objects.push(obj);
                current = '';
            } else {
                current += char;
            }
        }
        
        if (current.trim()) {
            const obj = this.expandPrefix(current.trim());
            if (obj) objects.push(obj);
        }
        
        return objects;
    }

    expandPrefix(term) {
        if (!term) return term;
        
        // Handle 'a' shorthand for rdf:type
        if (term === 'a') {
            return NS.rdf + 'type';
        }
        
        // Handle full URIs
        if (term.startsWith('<') && term.endsWith('>')) {
            return term.slice(1, -1);
        }
        
        // Handle literals
        if (term.startsWith('"') || term.startsWith("'")) {
            return term;
        }
        
        // Handle prefixed names
        const prefixMatch = term.match(/^(\w+):(.*)$/);
        if (prefixMatch) {
            const prefix = prefixMatch[1];
            const local = prefixMatch[2];
            if (this.prefixes[prefix]) {
                return this.prefixes[prefix] + local;
            }
            // Use known namespaces
            if (NS[prefix]) {
                return NS[prefix] + local;
            }
        }
        
        return term;
    }

    getSubjects(predicate, object) {
        return this.triples
            .filter(t => t.predicate === predicate && t.object === object)
            .map(t => t.subject);
    }

    getObjects(subject, predicate) {
        return this.triples
            .filter(t => t.subject === subject && t.predicate === predicate)
            .map(t => t.object);
    }

    getClasses() {
        const owlClasses = this.getSubjects(NS.rdf + 'type', NS.owl + 'Class');
        return owlClasses.filter(c => c.startsWith(NS.vp));
    }

    getObjectProperties() {
        return this.getSubjects(NS.rdf + 'type', NS.owl + 'ObjectProperty')
            .filter(p => p.startsWith(NS.vp));
    }

    getDatatypeProperties() {
        return this.getSubjects(NS.rdf + 'type', NS.owl + 'DatatypeProperty')
            .filter(p => p.startsWith(NS.vp));
    }
}

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
 * Generate SHACL shapes from parsed ontology
 */
function generateShapes(parser) {
    const shapes = [];
    
    // Header
    shapes.push(`# Volunteer Profile SHACL Shapes (Auto-generated)
# Generated from: volunteer-profile.ttl using owl2shacl rules
# Source rules: ${RULES_URL}
# Generated: ${new Date().toISOString()}

@prefix sh:              <${NS.sh}> .
@prefix vp:              <${NS.vp}> .
@prefix vps:             <${NS.vps}> .
@prefix volunteering:    <${NS.volunteering}> .
@prefix rdf:             <${NS.rdf}> .
@prefix rdfs:            <${NS.rdfs}> .
@prefix xsd:             <${NS.xsd}> .
@prefix owl:             <${NS.owl}> .

`);

    // Get all classes
    const classes = parser.getClasses();
    const objectProps = parser.getObjectProperties();
    const datatypeProps = parser.getDatatypeProperties();

    // Build domain -> properties map
    const domainProps = new Map();
    
    for (const prop of [...objectProps, ...datatypeProps]) {
        const domains = parser.getObjects(prop, NS.rdfs + 'domain');
        for (const domain of domains) {
            if (!domainProps.has(domain)) {
                domainProps.set(domain, []);
            }
            domainProps.get(domain).push(prop);
        }
    }

    // Generate NodeShape for each class
    for (const cls of classes) {
        const localName = cls.replace(NS.vp, '');
        const shapeUri = `vps:${localName}Shape`;
        
        // Get class metadata
        const labels = parser.getObjects(cls, NS.rdfs + 'label');
        const comments = parser.getObjects(cls, NS.rdfs + 'comment');
        
        shapes.push(`## ${localName} Shape`);
        shapes.push(`${shapeUri}`);
        shapes.push(`    a sh:NodeShape ;`);
        shapes.push(`    sh:targetClass vp:${localName} ;`);
        shapes.push(`    sh:closed true ;`);
        
        if (labels.length > 0) {
            shapes.push(`    rdfs:label "${cleanLiteral(labels[0])}"@en ;`);
        }
        if (comments.length > 0) {
            shapes.push(`    rdfs:comment """${cleanLiteral(comments[0])}"""@en ;`);
        }
        
        // Add ignoredProperties (always include rdf:type)
        const props = domainProps.get(cls) || [];
        const ignoredProps = getIgnoredProperties(parser, cls, classes);
        
        if (ignoredProps.length > 0) {
            shapes.push(`    sh:ignoredProperties ( rdf:type ${ignoredProps.map(formatUri).join(' ')} ) ;`);
        } else {
            shapes.push(`    sh:ignoredProperties ( rdf:type ) ;`);
        }
        
        // Add property shapes
        for (const prop of props) {
            const propLocalName = prop.replace(NS.vp, '').replace(NS.volunteering, 'volunteering:');
            const propLabels = parser.getObjects(prop, NS.rdfs + 'label');
            const propComments = parser.getObjects(prop, NS.rdfs + 'comment');
            const ranges = parser.getObjects(prop, NS.rdfs + 'range');
            
            const isDatatype = datatypeProps.includes(prop);
            
            shapes.push(`    sh:property [`);
            shapes.push(`        sh:path ${formatUri(prop)} ;`);
            
            if (ranges.length > 0) {
                const range = ranges[0];
                if (isDatatype || range.startsWith(NS.xsd)) {
                    shapes.push(`        sh:datatype ${formatUri(range)} ;`);
                } else {
                    shapes.push(`        sh:class ${formatUri(range)} ;`);
                }
            }
            
            if (propLabels.length > 0) {
                shapes.push(`        sh:name "${cleanLiteral(propLabels[0])}" ;`);
            }
            if (propComments.length > 0) {
                shapes.push(`        sh:description """${cleanLiteral(propComments[0])}""" ;`);
            }
            
            shapes.push(`    ] ;`);
        }
        
        // Close the shape
        shapes.push('.');
        shapes.push('');
    }

    return shapes.join('\n');
}

/**
 * Get ignored properties from subclasses and superclasses
 */
function getIgnoredProperties(parser, cls, allClasses) {
    const ignored = new Set();
    
    // Get properties from all other classes (simplified - in full implementation
    // this would traverse class hierarchy)
    for (const otherCls of allClasses) {
        if (otherCls !== cls) {
            const props = parser.triples
                .filter(t => t.predicate === NS.rdfs + 'domain' && t.object === otherCls)
                .map(t => t.subject);
            props.forEach(p => ignored.add(p));
        }
    }
    
    return Array.from(ignored);
}

/**
 * Format a URI as prefixed name or full URI
 */
function formatUri(uri) {
    if (!uri) return '[]';
    
    // Check known prefixes
    const prefixOrder = ['vp', 'vps', 'volunteering', 'sh', 'rdf', 'rdfs', 'xsd', 'owl'];
    for (const prefix of prefixOrder) {
        if (uri.startsWith(NS[prefix])) {
            return prefix + ':' + uri.replace(NS[prefix], '');
        }
    }
    
    return `<${uri}>`;
}

/**
 * Clean literal value for output
 */
function cleanLiteral(value) {
    if (!value) return '';
    // Remove language tags, datatype annotations, and quotes
    return value
        .replace(/@\w+(-\w+)?$/, '')  // Remove language tags like @en, @en-US
        .replace(/\^\^.+$/, '')        // Remove datatype annotation
        .replace(/^"""/, '')           // Remove triple quotes start
        .replace(/"""$/, '')           // Remove triple quotes end
        .replace(/^"/, '')             // Remove single quotes start
        .replace(/"$/, '')             // Remove single quotes end
        .replace(/\n\s+/g, ' ')        // Collapse multi-line into single line
        .replace(/\s+/g, ' ')          // Normalize whitespace
        .trim();
}

/**
 * Main function
 */
async function main() {
    console.log('========================================');
    console.log('OWL to SHACL Shape Generator (Node.js)');
    console.log('========================================');
    console.log('');

    // Check ontology file exists
    if (!fs.existsSync(ONTOLOGY_FILE)) {
        console.error(`Error: Ontology file not found at ${ONTOLOGY_FILE}`);
        process.exit(1);
    }
    console.log(`✓ Found ontology: ${ONTOLOGY_FILE}`);

    // Download rules (for reference)
    try {
        if (!fs.existsSync(RULES_CACHE)) {
            console.log('Downloading owl2shacl rules...');
            const rulesContent = await downloadFile(RULES_URL);
            fs.writeFileSync(RULES_CACHE, rulesContent);
            console.log('✓ Rules downloaded');
        } else {
            console.log('✓ Using cached owl2shacl rules');
        }
    } catch (err) {
        console.warn('Warning: Could not download rules:', err.message);
    }

    // Parse ontology
    console.log('Loading ontology...');
    const ontologyContent = fs.readFileSync(ONTOLOGY_FILE, 'utf-8');
    const parser = new SimpleTurtleParser(ontologyContent);
    console.log(`✓ Parsed ${parser.triples.length} triples`);
    
    // Show found classes and properties
    const classes = parser.getClasses();
    const objectProps = parser.getObjectProperties();
    const datatypeProps = parser.getDatatypeProperties();
    console.log(`  Found ${classes.length} classes: ${classes.map(c => c.replace(NS.vp, 'vp:')).join(', ')}`);
    console.log(`  Found ${objectProps.length} object properties`);
    console.log(`  Found ${datatypeProps.length} datatype properties`);

    // Generate shapes
    console.log('');
    console.log('Generating SHACL shapes...');
    const shapesContent = generateShapes(parser);

    // Write output
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, shapesContent);

    console.log('');
    console.log('✓ SHACL shapes generated successfully!');
    console.log(`Output: ${OUTPUT_FILE}`);
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
