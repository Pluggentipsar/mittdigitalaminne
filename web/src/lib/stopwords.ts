// Swedish and English stopwords for keyword extraction
export const STOPWORDS = new Set([
  // Swedish
  "och", "att", "som", "för", "den", "det", "har", "med", "var", "kan",
  "inte", "till", "ett", "en", "jag", "han", "hon", "vi", "de", "sin",
  "sitt", "sina", "man", "men", "eller", "om", "hur", "vad", "alla",
  "detta", "dessa", "dig", "mig", "sig", "oss", "dem", "deras", "hans",
  "hennes", "vara", "hade", "ska", "skulle", "där", "här", "nu", "bara",
  "när", "sedan", "under", "efter", "genom", "mot", "vid", "utan", "inom",
  "mellan", "även", "också", "mycket", "mer", "mest", "andra", "annan",
  "annat", "varje", "något", "någon", "några", "många", "hela", "stor",
  "liten", "från", "bli", "blir", "blev", "varit", "samt", "så", "då",
  "nog", "redan", "dock", "ännu", "ändå", "alltid", "aldrig", "ofta",
  "ganska", "väldigt", "helt", "lite", "gör", "göra", "gjort", "får",
  "fick", "ska", "kunna", "kunde", "vilja", "ville", "nya", "nytt",
  "bra", "bättre", "bäst", "stor", "större", "störst", "över", "inne",
  "ute", "upp", "ner", "två", "tre", "fyra", "fem", "sex", "sju", "åtta",
  "nio", "tio", "första", "andra", "tredje",

  // English
  "the", "and", "is", "it", "in", "to", "of", "for", "on", "with",
  "as", "at", "by", "an", "be", "this", "that", "from", "or", "but",
  "not", "are", "was", "were", "been", "has", "have", "had", "do", "does",
  "did", "will", "would", "could", "should", "may", "might", "can",
  "shall", "if", "then", "than", "so", "no", "yes", "its", "his", "her",
  "their", "our", "your", "my", "its", "who", "what", "which", "when",
  "where", "how", "why", "all", "each", "every", "both", "few", "more",
  "most", "other", "some", "such", "only", "own", "same", "too", "very",
  "just", "about", "above", "after", "again", "also", "any", "because",
  "before", "between", "both", "during", "here", "there", "these", "those",
  "through", "under", "until", "while", "into", "out", "up", "down",
  "new", "old", "get", "got", "one", "two", "three",

  // Common URL/web terms to ignore
  "http", "https", "www", "com", "org", "html", "php", "asp",
]);
