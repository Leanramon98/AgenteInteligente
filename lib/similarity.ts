export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i] || 0;
    const b = vecB[i] || 0;
    dotProduct += a * b;
    mA += a * a;
    mB += b * b;
  }
  
  const magnitude = Math.sqrt(mA) * Math.sqrt(mB);
  if (magnitude === 0) return 0;
  
  return dotProduct / magnitude;
}
