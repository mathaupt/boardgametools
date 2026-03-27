"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export function SwaggerViewer() {
  return (
    <div className="swagger-wrapper">
      <SwaggerUI url="/api/docs" />
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
        /* Dark mode support */
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
  );
}
