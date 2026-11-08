/** Decorative artwork mapping. No course IDs or progress semantics depend on this. */
export function chapterArtwork(moduleIndex: number) {
  if (moduleIndex < 2) return "/illustrations/shared-records.webp";
  if (moduleIndex === 5 || moduleIndex === 7)
    return "/illustrations/safe-decisions.webp";
  if (moduleIndex === 4 || moduleIndex === 6 || moduleIndex === 8)
    return "/illustrations/transaction-receipt.webp";
  return "/illustrations/course-wallet.webp";
}
