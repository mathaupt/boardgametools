"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

// Minimal type for the global Swagger UI bundle loader.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SwaggerUIInstance {}

interface SwaggerUIBundleType {
  (config: {
    url: string;
    dom_id: string;
    presets: unknown[];
    layout: string;
    deepLinking: boolean;
    showCommonExtensions: boolean;
    tryItOutEnabled: boolean;
    supportedSubmitMethods: string[];
  }): SwaggerUIInstance;
  presets: {
    apis: unknown;
  };
}

declare global {
  interface Window {
    SwaggerUIBundle?: SwaggerUIBundleType;
  }
}

const SWAGGER_UI_VERSION = "5.11.0";
const SWAGGER_CSS = `https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui.css`;
const SWAGGER_BUNDLE = `https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-bundle.js`;

export function SwaggerViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bundleReady, setBundleReady] = useState(false);

  useEffect(() => {
    if (!bundleReady || !containerRef.current || !window.SwaggerUIBundle) return;

    const container = containerRef.current;
    const ui = window.SwaggerUIBundle({
      url: "/api/docs",
      dom_id: "#swagger-ui",
      presets: [window.SwaggerUIBundle.presets.apis],
      layout: "BaseLayout",
      deepLinking: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
      supportedSubmitMethods: ["get", "post", "put", "delete", "patch"],
    });

    return () => {
      container.innerHTML = "";
      // The returned instance is intentionally opaque; we only clean the DOM.
      void ui;
    };
  }, [bundleReady]);

  return (
    <>
      <link rel="stylesheet" href={SWAGGER_CSS} />
      <Script
        src={SWAGGER_BUNDLE}
        strategy="afterInteractive"
        crossOrigin="anonymous"
        onLoad={() => setBundleReady(true)}
      />
      <div className="swagger-wrapper">
        <div id="swagger-ui" ref={containerRef} />
        <style jsx global>{`
          .swagger-wrapper .swagger-ui {
            font-family: var(--font-geist-sans), system-ui, sans-serif;
          }
          .swagger-wrapper .swagger-ui .topbar {
            display: none;
          }
          .swagger-wrapper .swagger-ui .info {
            margin: 20px 0;
          }
          .swagger-wrapper .swagger-ui .scheme-container {
            background: transparent;
            box-shadow: none;
            padding: 0;
          }
          .dark .swagger-wrapper .swagger-ui,
          .dark .swagger-wrapper .swagger-ui .info .title,
          .dark .swagger-wrapper .swagger-ui .info p,
          .dark .swagger-wrapper .swagger-ui .info li,
          .dark .swagger-wrapper .swagger-ui .opblock-tag,
          .dark .swagger-wrapper .swagger-ui table thead tr th,
          .dark .swagger-wrapper .swagger-ui table tbody tr td,
          .dark .swagger-wrapper .swagger-ui .parameter__name,
          .dark .swagger-wrapper .swagger-ui .parameter__type,
          .dark .swagger-wrapper .swagger-ui .response-col_status,
          .dark .swagger-wrapper .swagger-ui .response-col_description,
          .dark .swagger-wrapper .swagger-ui .opblock-description-wrapper p,
          .dark .swagger-wrapper .swagger-ui .opblock-external-docs-wrapper p,
          .dark .swagger-wrapper .swagger-ui .opblock-title_normal p,
          .dark .swagger-wrapper .swagger-ui .btn {
            color: hsl(var(--foreground));
          }
          .dark .swagger-wrapper .swagger-ui .opblock .opblock-summary-description {
            color: hsl(var(--muted-foreground));
          }
          .dark .swagger-wrapper .swagger-ui section.models,
          .dark .swagger-wrapper .swagger-ui .model-container,
          .dark .swagger-wrapper .swagger-ui .opblock .opblock-section-header {
            background: hsl(var(--card));
          }
        `}</style>
      </div>
    </>
  );
}
