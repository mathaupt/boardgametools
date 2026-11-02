import { fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { cleanup } from "@testing-library/react";
import { SessionCover } from "@/components/sessions/session-cover";

expect.extend(toHaveNoViolations);

vi.mock("next/image", () => ({
  default: ({ src, alt, width, height, sizes, className, onError }: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    sizes?: string;
    className?: string;
    onError?: () => void;
  }) => <img src={src} alt={alt} width={width} height={height} sizes={sizes} className={className} onError={onError} />,
}));

afterEach(cleanup);

describe("SessionCover", () => {
  it("renders a sized decorative cover for a supported image", () => {
    const { container } = render(<SessionCover imageUrl="https://cf.geekdo-images.com/azul.jpg" />);
    const image = container.querySelector("img");

    expect(image).toHaveAttribute("src", "https://cf.geekdo-images.com/azul.jpg");
    expect(image).toHaveAttribute("alt", "");
    expect(image).toHaveAttribute("width", "56");
    expect(image).toHaveAttribute("height", "56");
    expect(image).toHaveAttribute("sizes", "(max-width: 640px) 48px, 56px");
    expect(image?.parentElement).toHaveAttribute("aria-hidden", "true");
  });

  it("uses a quiet decorative fallback when there is no supported image", () => {
    const { container, queryByRole } = render(<SessionCover imageUrl="https://example.org/azul.jpg" />);

    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(container.querySelector("svg.lucide-dice-6")).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(queryByRole("img")).not.toBeInTheDocument();
  });

  it("switches to fallback after a load error and retries a different URL", () => {
    const { container, rerender } = render(<SessionCover imageUrl="https://cf.geekdo-images.com/broken.jpg" />);
    fireEvent.error(container.querySelector("img")!);

    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(container.querySelector("svg.lucide-dice-6")).toBeInTheDocument();

    rerender(<SessionCover imageUrl="https://cf.geekdo-images.com/working.jpg" />);
    expect(container.querySelector("img")).toHaveAttribute("src", "https://cf.geekdo-images.com/working.jpg");
  });

  it("does not announce decorative cover content twice", async () => {
    const { container } = render(<SessionCover imageUrl="https://cf.geekdo-images.com/azul.jpg" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
