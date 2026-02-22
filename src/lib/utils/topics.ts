import { Topic, TOPICS } from '@/types';

// Keyword map for fast topic classification without Claude
const TOPIC_KEYWORDS: Record<Topic, string[]> = {
  cell_biology: [
    'mitochondria', 'chloroplast', 'membrane', 'organelle', 'cytoplasm',
    'nucleus', 'ribosome', 'endoplasmic', 'golgi', 'lysosome', 'vacuole',
    'cell wall', 'plasma membrane', 'cytoskeleton', 'flagella', 'cilia',
    'mitosis', 'meiosis', 'cell cycle', 'apoptosis', 'endocytosis', 'exocytosis',
    'osmosis', 'diffusion', 'active transport', 'atp synthase',
  ],
  genetics: [
    'allele', 'genotype', 'phenotype', 'heterozygous', 'homozygous',
    'dominant', 'recessive', 'mendel', 'inheritance', 'punnett',
    'chromosome', 'gene', 'locus', 'mutation', 'crossing over',
    'linkage', 'epistasis', 'pleiotropy', 'sex-linked', 'autosomal',
    'pedigree', 'dihybrid', 'monohybrid', 'Hardy-Weinberg',
  ],
  molecular_biology: [
    'dna', 'rna', 'transcription', 'translation', 'replication',
    'nucleotide', 'codon', 'anticodon', 'mrna', 'trna', 'rrna',
    'promoter', 'operon', 'intron', 'exon', 'splicing', 'polymerase',
    'helicase', 'ligase', 'restriction enzyme', 'pcr', 'gel electrophoresis',
    'cloning', 'crispr', 'gene expression',
  ],
  evolution: [
    'natural selection', 'fitness', 'adaptation', 'speciation', 'darwin',
    'evolution', 'phylogeny', 'clade', 'homology', 'analogy',
    'convergent', 'divergent', 'genetic drift', 'gene flow', 'bottleneck',
    'founder effect', 'allopatric', 'sympatric', 'reproductive isolation',
    'fossil', 'selective pressure', 'variation',
  ],
  ecology: [
    'ecosystem', 'biome', 'population', 'community', 'habitat',
    'niche', 'food web', 'food chain', 'trophic', 'predator', 'prey',
    'competition', 'symbiosis', 'mutualism', 'parasitism', 'commensalism',
    'carrying capacity', 'limiting factor', 'biodiversity', 'succession',
    'nutrient cycle', 'carbon cycle', 'nitrogen cycle', 'biotic', 'abiotic',
  ],
  animal_biology: [
    'nervous system', 'neuron', 'synapse', 'hormone', 'endocrine',
    'circulatory', 'heart', 'blood', 'lung', 'respiratory', 'digestive',
    'kidney', 'excretory', 'immune', 'muscle', 'skeleton', 'bone',
    'vertebrate', 'invertebrate', 'mammal', 'bird', 'reptile', 'amphibian',
    'fish', 'homeostasis', 'thermoregulation',
  ],
  plant_biology: [
    'photosynthesis', 'chlorophyll', 'stomata', 'xylem', 'phloem',
    'transpiration', 'root', 'stem', 'leaf', 'flower', 'fruit', 'seed',
    'pollen', 'germination', 'tropism', 'auxin', 'gibberellin', 'vascular',
    'angiosperm', 'gymnosperm', 'bryophyte', 'fern', 'monocot', 'dicot',
    'pollination', 'fertilization in plants',
  ],
  microbiology: [
    'bacteria', 'virus', 'fungi', 'archaea', 'pathogen', 'infection',
    'antibiotic', 'gram positive', 'gram negative', 'plasmid', 'flagellum',
    'capsid', 'bacteriophage', 'lytic', 'lysogenic', 'fermentation',
    'prokaryote', 'microorganism', 'colony', 'culture', 'sterilization',
  ],
  biochemistry: [
    'enzyme', 'substrate', 'active site', 'inhibitor', 'catalyst',
    'protein', 'amino acid', 'peptide', 'lipid', 'fatty acid', 'carbohydrate',
    'glucose', 'glycolysis', 'krebs cycle', 'oxidative phosphorylation',
    'atp', 'nadh', 'fadh2', 'metabolism', 'anabolism', 'catabolism',
    'ph', 'buffer', 'cofactor', 'coenzyme', 'allosteric',
  ],
};

export function classifyTopicByKeywords(text: string): Topic | null {
  const lower = text.toLowerCase();
  const scores: Record<Topic, number> = {} as Record<Topic, number>;

  for (const topic of TOPICS) {
    let score = 0;
    for (const keyword of TOPIC_KEYWORDS[topic]) {
      if (lower.includes(keyword)) score++;
    }
    scores[topic] = score;
  }

  const best = TOPICS.reduce((a, b) => (scores[a] >= scores[b] ? a : b));
  return scores[best] > 0 ? best : null;
}
