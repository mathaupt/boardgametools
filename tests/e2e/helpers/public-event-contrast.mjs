export function measurePublicEventContrast(themeName, proposalId) {
  document.documentElement.classList.toggle("dark", themeName === "dark");
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  function rgba(color) {
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  }

  function over(front, back) {
    return front.slice(0, 3).map((channel, index) =>
      channel * front[3] + back[index] * (1 - front[3]),
    ).concat(1);
  }

  function luminance([r, g, b]) {
    return [r, g, b].map((channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  }

  function contrastRatio(foreground, background) {
    const a = luminance(foreground);
    const b = luminance(background);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }

  const samples = [
    ...document.querySelectorAll(`[data-testid="date-row-${proposalId}"] dd`),
    ...document.querySelectorAll(`[data-testid="date-row-${proposalId}"] h3`),
    ...document.querySelectorAll(`[data-testid="date-availability-group-${proposalId}"] label`),
    ...document.querySelectorAll("p.font-semibold.text-foreground"),
    ...Array.from(document.querySelectorAll("div")).filter((element) =>
      element.textContent?.trim() === "Abgesagt" && element.className.includes("bg-destructive"),
    ),
  ];

  return samples.map((element) => {
    const ancestors = [];
    for (let node = element; node; node = node.parentElement) ancestors.unshift(node);
    let background = rgba(getComputedStyle(document.body).backgroundColor);
    for (const node of ancestors) {
      background = over(rgba(getComputedStyle(node).backgroundColor), background);
    }
    const foreground = over(rgba(getComputedStyle(element).color), background);
    return { text: element.textContent?.trim(), ratio: contrastRatio(foreground, background) };
  });
}
