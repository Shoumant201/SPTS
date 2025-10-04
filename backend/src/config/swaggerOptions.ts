import { SwaggerUIOptions, SwaggerUISwaggerOptions, EnvironmentConfig } from './swagger';

// SPTM Brand Colors and Styling
export const SPTM_BRAND_COLORS = {
  primary: '#2563eb',      // Blue primary
  secondary: '#1e40af',    // Darker blue
  accent: '#3b82f6',       // Light blue accent
  success: '#10b981',      // Green for success states
  warning: '#f59e0b',      // Amber for warnings
  error: '#ef4444',        // Red for errors
  background: '#f8fafc',   // Light gray background
  surface: '#ffffff',      // White surface
  text: '#1f2937',         // Dark gray text
  textSecondary: '#6b7280' // Medium gray text
} as const;

// Custom CSS for SPTM branding
export const SPTM_CUSTOM_CSS = `
  /* SPTM Brand Styling */
  .swagger-ui .topbar {
    background: linear-gradient(135deg, ${SPTM_BRAND_COLORS.primary} 0%, ${SPTM_BRAND_COLORS.secondary} 100%);
    border-bottom: 3px solid ${SPTM_BRAND_COLORS.secondary};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 10px 0;
  }

  .swagger-ui .topbar .download-url-wrapper {
    display: none;
  }

  .swagger-ui .topbar-wrapper {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .swagger-ui .topbar-wrapper img {
    content: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgwIiBoZWlnaHQ9IjUwIiB2aWV3Qm94PSIwIDAgMTgwIDUwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTgwIiBoZWlnaHQ9IjUwIiByeD0iOCIgZmlsbD0idHJhbnNwYXJlbnQiLz4KPHN2ZyB4PSIxMCIgeT0iMTAiIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0xOSA3aDFhMiAyIDAgMCAxIDIgMnYxMGEyIDIgMCAwIDEtMiAySDRhMiAyIDAgMCAxLTItMlY5YTIgMiAwIDAgMSAyLTJoMVY1YTMgMyAwIDAgMSAzLTNoOGEzIDMgMCAwIDEgMyAzdjJ6TTcgN2gxMFY1YTEgMSAwIDAgMC0xLTFIOGExIDEgMCAwIDAtMSAxdjJ6bTEwIDRIOXYyaDh2LTJ6Ii8+Cjwvc3ZnPgo8dGV4dCB4PSI1MCIgeT0iMzIiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIj5TUFRNIEFQSTY8L3RleHQ+Cjx0ZXh0IHg9IjUwIiB5PSI0NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmaWxsPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuOCkiPlNtYXJ0IFB1YmxpYyBUcmFuc3BvcnQgTWFuYWdlbWVudDwvdGV4dD4KPC9zdmc+Cg==');
    height: 50px;
    width: auto;
  }

  /* Add SPTM logo and branding to the top */
  .swagger-ui .topbar::before {
    content: "";
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 40px;
    background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuMiIvPgo8c3ZnIHg9IjgiIHk9IjgiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0xOSA3aDFhMiAyIDAgMCAxIDIgMnYxMGEyIDIgMCAwIDEtMiAySDRhMiAyIDAgMCAxLTItMlY5YTIgMiAwIDAgMSAyLTJoMVY1YTMgMyAwIDAgMSAzLTNoOGEzIDMgMCAwIDEgMyAzdjJ6TTcgN2gxMFY1YTEgMSAwIDAgMC0xLTFIOGExIDEgMCAwIDAtMSAxdjJ6bTEwIDRIOXYyaDh2LTJ6Ii8+Cjwvc3ZnPgo8L3N2Zz4K') no-repeat center;
    background-size: contain;
  }

  /* Header styling */
  .swagger-ui .info {
    margin: 30px 0;
    padding: 30px;
    background: linear-gradient(135deg, ${SPTM_BRAND_COLORS.background} 0%, #ffffff 100%);
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .swagger-ui .info .title {
    color: ${SPTM_BRAND_COLORS.primary};
    font-size: 2.8rem;
    font-weight: 800;
    margin-bottom: 15px;
    text-shadow: 0 2px 4px rgba(37, 99, 235, 0.1);
    position: relative;
  }

  .swagger-ui .info .title::after {
    content: "";
    position: absolute;
    bottom: -8px;
    left: 0;
    width: 60px;
    height: 4px;
    background: linear-gradient(90deg, ${SPTM_BRAND_COLORS.primary}, ${SPTM_BRAND_COLORS.accent});
    border-radius: 2px;
  }

  .swagger-ui .info .description {
    color: ${SPTM_BRAND_COLORS.text};
    font-size: 1.1rem;
    line-height: 1.7;
    margin-top: 20px;
  }

  .swagger-ui .info .description p {
    margin-bottom: 15px;
  }

  .swagger-ui .info .description h2 {
    color: ${SPTM_BRAND_COLORS.primary};
    font-size: 1.4rem;
    font-weight: 600;
    margin: 25px 0 15px 0;
    border-left: 4px solid ${SPTM_BRAND_COLORS.primary};
    padding-left: 15px;
  }

  /* Operation styling */
  .swagger-ui .opblock {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 15px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .swagger-ui .opblock.opblock-post {
    border-color: ${SPTM_BRAND_COLORS.success};
  }

  .swagger-ui .opblock.opblock-post .opblock-summary {
    border-color: ${SPTM_BRAND_COLORS.success};
  }

  .swagger-ui .opblock.opblock-get {
    border-color: ${SPTM_BRAND_COLORS.primary};
  }

  .swagger-ui .opblock.opblock-get .opblock-summary {
    border-color: ${SPTM_BRAND_COLORS.primary};
  }

  .swagger-ui .opblock.opblock-put {
    border-color: ${SPTM_BRAND_COLORS.warning};
  }

  .swagger-ui .opblock.opblock-put .opblock-summary {
    border-color: ${SPTM_BRAND_COLORS.warning};
  }

  .swagger-ui .opblock.opblock-delete {
    border-color: ${SPTM_BRAND_COLORS.error};
  }

  .swagger-ui .opblock.opblock-delete .opblock-summary {
    border-color: ${SPTM_BRAND_COLORS.error};
  }

  /* Button styling */
  .swagger-ui .btn {
    border-radius: 6px;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .swagger-ui .btn.authorize {
    background-color: ${SPTM_BRAND_COLORS.primary};
    border-color: ${SPTM_BRAND_COLORS.primary};
  }

  .swagger-ui .btn.authorize:hover {
    background-color: ${SPTM_BRAND_COLORS.secondary};
    border-color: ${SPTM_BRAND_COLORS.secondary};
  }

  .swagger-ui .btn.execute {
    background-color: ${SPTM_BRAND_COLORS.success};
    border-color: ${SPTM_BRAND_COLORS.success};
  }

  .swagger-ui .btn.execute:hover {
    background-color: #059669;
    border-color: #059669;
  }

  .swagger-ui .btn.try-out__btn {
    background-color: ${SPTM_BRAND_COLORS.accent};
    border-color: ${SPTM_BRAND_COLORS.accent};
    color: white;
  }

  .swagger-ui .btn.try-out__btn:hover {
    background-color: ${SPTM_BRAND_COLORS.primary};
    border-color: ${SPTM_BRAND_COLORS.primary};
  }

  /* Schema styling */
  .swagger-ui .model-box {
    background-color: ${SPTM_BRAND_COLORS.background};
    border: 1px solid #e5e7eb;
    border-radius: 6px;
  }

  .swagger-ui .model .property {
    color: ${SPTM_BRAND_COLORS.text};
  }

  .swagger-ui .model .property.primitive {
    color: ${SPTM_BRAND_COLORS.primary};
  }

  /* Response styling */
  .swagger-ui .responses-inner h4 {
    color: ${SPTM_BRAND_COLORS.text};
    font-weight: 600;
  }

  .swagger-ui .response-col_status {
    color: ${SPTM_BRAND_COLORS.success};
    font-weight: 600;
  }

  /* Authentication modal styling */
  .swagger-ui .auth-container {
    border: 2px solid ${SPTM_BRAND_COLORS.primary};
    border-radius: 12px;
    background: linear-gradient(135deg, #ffffff 0%, ${SPTM_BRAND_COLORS.background} 100%);
    box-shadow: 0 8px 32px rgba(37, 99, 235, 0.15);
    padding: 20px;
    margin: 20px 0;
  }

  .swagger-ui .auth-container h4 {
    color: ${SPTM_BRAND_COLORS.primary};
    font-size: 1.3rem;
    font-weight: 700;
    margin-bottom: 15px;
    text-align: center;
    position: relative;
  }

  .swagger-ui .auth-container h4::before {
    content: "🔐";
    margin-right: 10px;
  }

  .swagger-ui .auth-container h4::after {
    content: "";
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, ${SPTM_BRAND_COLORS.primary}, ${SPTM_BRAND_COLORS.accent});
    border-radius: 2px;
  }

  /* Auth input styling */
  .swagger-ui .auth-container input[type="text"],
  .swagger-ui .auth-container input[type="password"] {
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    padding: 12px 15px;
    font-size: 1rem;
    width: 100%;
    margin: 8px 0;
    transition: all 0.2s ease;
    background: white;
  }

  .swagger-ui .auth-container input[type="text"]:focus,
  .swagger-ui .auth-container input[type="password"]:focus {
    border-color: ${SPTM_BRAND_COLORS.primary};
    outline: none;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    background: #fafbff;
  }

  /* Auth buttons */
  .swagger-ui .auth-btn-wrapper {
    text-align: center;
    margin-top: 20px;
  }

  .swagger-ui .auth-btn-wrapper .btn {
    margin: 0 10px;
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .swagger-ui .auth-btn-wrapper .btn.authorize {
    background: linear-gradient(135deg, ${SPTM_BRAND_COLORS.primary} 0%, ${SPTM_BRAND_COLORS.secondary} 100%);
    border: none;
    color: white;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  }

  .swagger-ui .auth-btn-wrapper .btn.authorize:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
  }

  .swagger-ui .auth-btn-wrapper .btn.cancel {
    background: #f3f4f6;
    border: 2px solid #d1d5db;
    color: ${SPTM_BRAND_COLORS.text};
  }

  .swagger-ui .auth-btn-wrapper .btn.cancel:hover {
    background: #e5e7eb;
    border-color: #9ca3af;
  }

  /* Auth success/error messages */
  .swagger-ui .auth-container .auth-error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: ${SPTM_BRAND_COLORS.error};
    padding: 10px 15px;
    border-radius: 6px;
    margin: 10px 0;
  }

  .swagger-ui .auth-container .auth-success {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: ${SPTM_BRAND_COLORS.success};
    padding: 10px 15px;
    border-radius: 6px;
    margin: 10px 0;
  }

  /* Authorization indicator */
  .swagger-ui .auth-wrapper .authorize-wrapper {
    position: relative;
  }

  .swagger-ui .auth-wrapper .authorize-wrapper::after {
    content: "Click to configure authentication for interactive testing";
    position: absolute;
    bottom: -25px;
    left: 0;
    font-size: 0.8rem;
    color: ${SPTM_BRAND_COLORS.textSecondary};
    font-style: italic;
  }

  /* Parameter styling */
  .swagger-ui .parameters-col_description input[type="text"],
  .swagger-ui .parameters-col_description textarea {
    border: 1px solid #d1d5db;
    border-radius: 4px;
    padding: 8px 12px;
  }

  .swagger-ui .parameters-col_description input[type="text"]:focus,
  .swagger-ui .parameters-col_description textarea:focus {
    border-color: ${SPTM_BRAND_COLORS.primary};
    outline: none;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
  }

  /* Tag styling */
  .swagger-ui .opblock-tag {
    color: ${SPTM_BRAND_COLORS.text};
    font-weight: 700;
    font-size: 1.4rem;
    margin: 30px 0 15px 0;
    padding: 15px 20px;
    background: linear-gradient(135deg, ${SPTM_BRAND_COLORS.primary} 0%, ${SPTM_BRAND_COLORS.secondary} 100%);
    color: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
    position: relative;
    overflow: hidden;
  }

  .swagger-ui .opblock-tag::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
    transform: translateX(-100%);
    transition: transform 0.6s ease;
  }

  .swagger-ui .opblock-tag:hover::before {
    transform: translateX(100%);
  }

  .swagger-ui .opblock-tag small {
    color: rgba(255, 255, 255, 0.9);
    font-weight: 400;
    font-size: 0.85rem;
    margin-left: 10px;
  }

  /* Server selection styling */
  .swagger-ui .scheme-container {
    background-color: ${SPTM_BRAND_COLORS.background};
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 15px;
    margin-bottom: 20px;
  }

  .swagger-ui .scheme-container .schemes-title {
    color: ${SPTM_BRAND_COLORS.text};
    font-weight: 600;
  }

  /* Error styling */
  .swagger-ui .errors-wrapper {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    color: ${SPTM_BRAND_COLORS.error};
  }

  /* Loading spinner */
  .swagger-ui .loading-container .loading:after {
    border-color: ${SPTM_BRAND_COLORS.primary} transparent ${SPTM_BRAND_COLORS.primary} transparent;
  }

  /* Custom footer */
  .swagger-ui .info .description:after {
    content: "\\A\\A🚌 Smart Public Transport Management System \\A© 2025 SPTM Development Team \\A\\A🔗 Need help? Contact: dev@sptm.com";
    white-space: pre;
    display: block;
    margin-top: 30px;
    padding: 20px;
    border-top: 2px solid ${SPTM_BRAND_COLORS.primary};
    background: linear-gradient(135deg, ${SPTM_BRAND_COLORS.background} 0%, #ffffff 100%);
    border-radius: 8px;
    color: ${SPTM_BRAND_COLORS.textSecondary};
    font-size: 0.9rem;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  /* Add a subtle animation to the footer */
  .swagger-ui .info .description:after {
    animation: fadeInUp 0.6s ease-out;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Interactive guidance tooltips */
  .swagger-ui .btn.try-out__btn::after {
    content: "Click to enable interactive testing";
    position: absolute;
    bottom: -30px;
    left: 50%;
    transform: translateX(-50%);
    background: ${SPTM_BRAND_COLORS.text};
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.7rem;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
    z-index: 1000;
  }

  .swagger-ui .btn.try-out__btn:hover::after {
    opacity: 1;
  }

  .swagger-ui .btn.authorize::after {
    content: "Configure authentication for testing";
    position: absolute;
    bottom: -30px;
    left: 50%;
    transform: translateX(-50%);
    background: ${SPTM_BRAND_COLORS.text};
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.7rem;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
    z-index: 1000;
  }

  .swagger-ui .btn.authorize:hover::after {
    opacity: 1;
  }

  .swagger-ui .btn.execute::after {
    content: "Send request to API";
    position: absolute;
    bottom: -30px;
    left: 50%;
    transform: translateX(-50%);
    background: ${SPTM_BRAND_COLORS.text};
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.7rem;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
    z-index: 1000;
  }

  .swagger-ui .btn.execute:hover::after {
    opacity: 1;
  }

  /* Add loading animation */
  .swagger-ui .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
  }

  .swagger-ui .loading-container .loading {
    position: relative;
  }

  .swagger-ui .loading-container .loading::before {
    content: "Loading SPTM API Documentation...";
    position: absolute;
    top: 60px;
    left: 50%;
    transform: translateX(-50%);
    color: ${SPTM_BRAND_COLORS.primary};
    font-weight: 600;
    white-space: nowrap;
  }

  /* Enhanced operation blocks */
  .swagger-ui .opblock {
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .swagger-ui .opblock:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }

  .swagger-ui .opblock::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    transition: left 0.5s ease;
  }

  .swagger-ui .opblock:hover::before {
    left: 100%;
  }

  /* Enhanced try-it-out section */
  .swagger-ui .try-out {
    background: linear-gradient(135deg, ${SPTM_BRAND_COLORS.background} 0%, #ffffff 100%);
    border-radius: 8px;
    padding: 20px;
    margin: 15px 0;
    border: 2px solid ${SPTM_BRAND_COLORS.primary};
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
    position: relative;
  }

  .swagger-ui .try-out::before {
    content: "🧪 Interactive Testing Mode";
    position: absolute;
    top: -12px;
    left: 20px;
    background: ${SPTM_BRAND_COLORS.primary};
    color: white;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  /* Enhanced execute button */
  .swagger-ui .execute-wrapper {
    text-align: center;
    margin: 20px 0;
  }

  .swagger-ui .btn.execute {
    background: linear-gradient(135deg, ${SPTM_BRAND_COLORS.success} 0%, #059669 100%);
    border: none;
    padding: 12px 30px;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .swagger-ui .btn.execute::before {
    content: "🚀";
    margin-right: 8px;
  }

  .swagger-ui .btn.execute:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  }

  .swagger-ui .btn.execute:active {
    transform: translateY(0);
  }

  /* Enhanced parameter inputs */
  .swagger-ui .parameters-col_description input[type="text"],
  .swagger-ui .parameters-col_description textarea,
  .swagger-ui .parameters-col_description select {
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    padding: 10px 15px;
    font-size: 0.95rem;
    transition: all 0.2s ease;
    background: white;
  }

  .swagger-ui .parameters-col_description input[type="text"]:focus,
  .swagger-ui .parameters-col_description textarea:focus,
  .swagger-ui .parameters-col_description select:focus {
    border-color: ${SPTM_BRAND_COLORS.primary};
    outline: none;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    background: #fafbff;
  }

  /* Parameter labels */
  .swagger-ui .parameters-col_name {
    font-weight: 600;
    color: ${SPTM_BRAND_COLORS.text};
  }

  .swagger-ui .parameter__name.required::after {
    content: " *";
    color: ${SPTM_BRAND_COLORS.error};
    font-weight: bold;
  }

  /* Request body editor */
  .swagger-ui .body-param-options {
    margin: 15px 0;
  }

  .swagger-ui .body-param textarea {
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    padding: 15px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.9rem;
    line-height: 1.5;
    background: #f8fafc;
    transition: all 0.2s ease;
  }

  .swagger-ui .body-param textarea:focus {
    border-color: ${SPTM_BRAND_COLORS.primary};
    background: white;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  /* Enhanced response section */
  .swagger-ui .responses-wrapper {
    background: linear-gradient(135deg, ${SPTM_BRAND_COLORS.background} 0%, #ffffff 100%);
    border-radius: 8px;
    padding: 20px;
    margin-top: 15px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .swagger-ui .response .response-col_status {
    font-weight: 700;
    font-size: 1.1rem;
    padding: 8px 12px;
    border-radius: 6px;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  /* Status code colors */
  .swagger-ui .response .response-col_status[data-code^="2"] {
    background: linear-gradient(135deg, ${SPTM_BRAND_COLORS.success} 0%, #059669 100%);
  }

  .swagger-ui .response .response-col_status[data-code^="4"] {
    background: linear-gradient(135deg, ${SPTM_BRAND_COLORS.warning} 0%, #d97706 100%);
  }

  .swagger-ui .response .response-col_status[data-code^="5"] {
    background: linear-gradient(135deg, ${SPTM_BRAND_COLORS.error} 0%, #dc2626 100%);
  }

  /* Response body styling */
  .swagger-ui .response-col_description {
    padding: 15px;
    background: white;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    margin-top: 10px;
  }

  .swagger-ui .response-col_description pre {
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    padding: 15px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.9rem;
    line-height: 1.5;
    overflow-x: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  /* Live response section */
  .swagger-ui .live-responses-table {
    margin-top: 20px;
    border: 2px solid ${SPTM_BRAND_COLORS.primary};
    border-radius: 8px;
    overflow: hidden;
    background: white;
  }

  .swagger-ui .live-responses-table .response-col_status {
    background: ${SPTM_BRAND_COLORS.primary};
    color: white;
    padding: 12px;
    font-weight: 600;
  }

  .swagger-ui .live-responses-table .response-col_description {
    padding: 20px;
    background: #fafbff;
  }

  /* Request duration display */
  .swagger-ui .request-time {
    background: ${SPTM_BRAND_COLORS.accent};
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    margin-left: 10px;
  }

  /* Copy button styling */
  .swagger-ui .copy-to-clipboard {
    background: ${SPTM_BRAND_COLORS.primary};
    border: none;
    color: white;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .swagger-ui .copy-to-clipboard:hover {
    background: ${SPTM_BRAND_COLORS.secondary};
    transform: translateY(-1px);
  }

  /* Add subtle animations */
  .swagger-ui .opblock-summary {
    transition: all 0.2s ease;
  }

  .swagger-ui .opblock-summary:hover {
    background-color: rgba(37, 99, 235, 0.05);
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .swagger-ui .info .title {
      font-size: 2.2rem;
    }
    
    .swagger-ui .info {
      padding: 20px;
      margin: 20px 0;
    }
    
    .swagger-ui .opblock {
      margin-bottom: 10px;
    }

    .swagger-ui .opblock-tag {
      font-size: 1.2rem;
      padding: 12px 15px;
    }

    .swagger-ui .topbar-wrapper img {
      height: 40px;
    }
  }

  @media (max-width: 480px) {
    .swagger-ui .info .title {
      font-size: 1.8rem;
    }

    .swagger-ui .topbar::before {
      display: none;
    }
  }
`;

// Development-specific customizations
export const DEVELOPMENT_CUSTOMIZATIONS = `
  /* Development environment indicator */
  .swagger-ui .info .title:before {
    content: "🔧 DEVELOPMENT - ";
    color: ${SPTM_BRAND_COLORS.warning};
    font-weight: 700;
    background: rgba(245, 158, 11, 0.1);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.7em;
    margin-right: 10px;
    border: 1px solid ${SPTM_BRAND_COLORS.warning};
  }

  .swagger-ui .topbar {
    background: linear-gradient(135deg, ${SPTM_BRAND_COLORS.warning} 0%, ${SPTM_BRAND_COLORS.primary} 50%, ${SPTM_BRAND_COLORS.secondary} 100%);
    position: relative;
  }

  .swagger-ui .topbar::after {
    content: "DEVELOPMENT ENVIRONMENT";
    position: absolute;
    right: 80px;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(245, 158, 11, 0.9);
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  /* Development server highlight */
  .swagger-ui .scheme-container {
    background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 10%, #fef3c7 100%);
    border: 2px solid ${SPTM_BRAND_COLORS.warning};
    position: relative;
  }

  .swagger-ui .scheme-container::before {
    content: "⚠️ Development Server - All features enabled for testing";
    display: block;
    background: ${SPTM_BRAND_COLORS.warning};
    color: white;
    padding: 8px 15px;
    margin: -15px -15px 15px -15px;
    font-weight: 600;
    font-size: 0.9rem;
    border-radius: 6px 6px 0 0;
  }

  /* Development-specific operation styling */
  .swagger-ui .opblock.opblock-post {
    border-left: 4px solid ${SPTM_BRAND_COLORS.warning};
  }

  .swagger-ui .opblock.opblock-get {
    border-left: 4px solid ${SPTM_BRAND_COLORS.primary};
  }

  .swagger-ui .opblock.opblock-put {
    border-left: 4px solid ${SPTM_BRAND_COLORS.accent};
  }

  .swagger-ui .opblock.opblock-delete {
    border-left: 4px solid ${SPTM_BRAND_COLORS.error};
  }
`;

// Production-specific customizations
export const PRODUCTION_CUSTOMIZATIONS = `
  /* Production environment indicator */
  .swagger-ui .info .title:before {
    content: "🚀 PRODUCTION - ";
    color: ${SPTM_BRAND_COLORS.success};
    font-weight: 700;
    background: rgba(16, 185, 129, 0.1);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.7em;
    margin-right: 10px;
    border: 1px solid ${SPTM_BRAND_COLORS.success};
  }

  .swagger-ui .topbar::after {
    content: "PRODUCTION ENVIRONMENT";
    position: absolute;
    right: 80px;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(16, 185, 129, 0.9);
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  /* Production security notice */
  .swagger-ui .scheme-container::before {
    content: "🔒 Production Environment - Limited operations available for security";
    display: block;
    background: ${SPTM_BRAND_COLORS.success};
    color: white;
    padding: 8px 15px;
    margin: -15px -15px 15px -15px;
    font-weight: 600;
    font-size: 0.9rem;
    border-radius: 6px 6px 0 0;
  }

  /* Hide development-specific features in production */
  .swagger-ui .scheme-container .schemes .schemes-title {
    display: none;
  }
  
  .swagger-ui .scheme-container select {
    display: none;
  }

  /* Production-specific styling */
  .swagger-ui .opblock {
    border-left: 3px solid ${SPTM_BRAND_COLORS.success};
  }
`;

// Staging-specific customizations
export const STAGING_CUSTOMIZATIONS = `
  /* Staging environment indicator */
  .swagger-ui .info .title:before {
    content: "🧪 STAGING - ";
    color: ${SPTM_BRAND_COLORS.accent};
    font-weight: 700;
    background: rgba(59, 130, 246, 0.1);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.7em;
    margin-right: 10px;
    border: 1px solid ${SPTM_BRAND_COLORS.accent};
  }

  .swagger-ui .topbar {
    background: linear-gradient(135deg, ${SPTM_BRAND_COLORS.accent} 0%, ${SPTM_BRAND_COLORS.primary} 100%);
  }

  .swagger-ui .topbar::after {
    content: "STAGING ENVIRONMENT";
    position: absolute;
    right: 80px;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(59, 130, 246, 0.9);
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  /* Staging server highlight */
  .swagger-ui .scheme-container {
    background: linear-gradient(135deg, #dbeafe 0%, #93c5fd 10%, #dbeafe 100%);
    border: 2px solid ${SPTM_BRAND_COLORS.accent};
  }

  .swagger-ui .scheme-container::before {
    content: "🧪 Staging Server - Testing environment with production-like data";
    display: block;
    background: ${SPTM_BRAND_COLORS.accent};
    color: white;
    padding: 8px 15px;
    margin: -15px -15px 15px -15px;
    font-weight: 600;
    font-size: 0.9rem;
    border-radius: 6px 6px 0 0;
  }

  /* Staging-specific operation styling */
  .swagger-ui .opblock {
    border-left: 3px solid ${SPTM_BRAND_COLORS.accent};
  }
`;

// Swagger UI configuration options
export const createSwaggerUIOptions = (env: EnvironmentConfig): SwaggerUIOptions => {
  // Base CSS with SPTM branding
  let customCss = SPTM_CUSTOM_CSS;

  // Add environment-specific styling
  if (env.isDevelopment) {
    customCss += DEVELOPMENT_CUSTOMIZATIONS;
  } else if (env.isProduction) {
    customCss += PRODUCTION_CUSTOMIZATIONS;
  } else if (env.isStaging) {
    customCss += STAGING_CUSTOMIZATIONS;
  }

  const swaggerOptions: SwaggerUISwaggerOptions = {
    // UI behavior configuration
    docExpansion: 'none',                    // Keep operations collapsed by default
    filter: true,                            // Enable search/filter functionality
    showExtensions: false,                   // Hide vendor extensions
    showCommonExtensions: false,             // Hide common extensions
    tryItOutEnabled: true,                   // Enable "Try it out" functionality (but not auto-active)
    
    // Display configuration
    defaultModelsExpandDepth: env.isDevelopment ? 1 : 0,  // Don't auto-expand models
    defaultModelExpandDepth: env.isDevelopment ? 1 : 0,   // Don't auto-expand model details
    defaultModelRendering: 'example',        // Show examples by default
    displayOperationId: env.isDevelopment,   // Show operation IDs only in development
    displayRequestDuration: true,            // Show request duration
    deepLinking: true,                       // Enable deep linking for better UX
    showMutatedRequest: env.isDevelopment,   // Show actual request only in development
    
    // Sorting configuration
    apisSorter: 'alpha',                     // Sort APIs alphabetically
    operationsSorter: 'alpha',               // Sort operations alphabetically
    
    // Supported HTTP methods for "Try it out" - restrict in production
    supportedSubmitMethods: env.isProduction 
      ? ['get', 'post']  // Only allow safe methods in production
      : ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'],
    
    // Validation - use environment variable or disable in production
    validatorUrl: env.isProduction 
      ? null 
      : (process.env.SWAGGER_VALIDATOR_URL || null),
    
    // Request/Response interceptors for authentication and logging
    requestInterceptor: (request: any) => {
      try {
        // Ensure request object exists and has required properties
        if (!request) {
          console.warn('Swagger UI: Request object is null or undefined');
          return request;
        }

        // Initialize headers if they don't exist
        if (!request.headers) {
          request.headers = {};
        }

        // Add timestamp to requests for debugging
        if (env.isDevelopment) {
          console.log('Swagger UI Request:', {
            url: request.url || 'unknown',
            method: request.method || 'unknown',
            headers: request.headers || {},
            body: request.body || null,
            timestamp: new Date().toISOString()
          });
        }
        
        // Ensure proper content-type for JSON requests
        if (request.body && typeof request.body === 'object' && !request.headers['Content-Type']) {
          request.headers['Content-Type'] = 'application/json';
        }
        
        // Ensure CORS headers are properly set for interactive testing
        if (!request.headers['Accept']) {
          request.headers['Accept'] = 'application/json, text/plain, */*';
        }
        
        // Add cache control headers to prevent caching issues during testing
        request.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        request.headers['Pragma'] = 'no-cache';
        request.headers['Expires'] = '0';
        
        return request;
      } catch (error) {
        console.error('Swagger UI Request Interceptor Error:', error);
        return request;
      }
    },
    
    responseInterceptor: (response: any) => {
      try {
        // Ensure response object exists
        if (!response) {
          console.warn('Swagger UI: Response object is null or undefined');
          return response;
        }

        // Log responses in development
        if (env.isDevelopment) {
          console.log('Swagger UI Response:', {
            url: response.url || 'unknown',
            status: response.status || 'unknown',
            statusText: response.statusText || 'unknown',
            headers: response.headers || {},
            body: response.body || null,
            timestamp: new Date().toISOString()
          });
        }
        
        // Handle authentication errors gracefully
        if (response.status === 401) {
          console.warn('Authentication failed - check your Bearer token');
        }
        
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = (response.headers && response.headers['retry-after']) || 'unknown';
          console.warn(`Rate limit exceeded. Retry after: ${retryAfter} seconds`);
        }
        
        return response;
      } catch (error) {
        console.error('Swagger UI Response Interceptor Error:', error);
        return response;
      }
    },
    
    // Callback functions
    onComplete: () => {
      try {
        if (env.isDevelopment) {
          console.log('Swagger UI loaded successfully');
        }
      } catch (error) {
        console.error('Swagger UI onComplete error:', error);
      }
    },
    
    onFailure: (error: any) => {
      console.error('Swagger UI failed to load:', error);
    }
  };

  return {
    customCss,
    customSiteTitle: `SPTM API Documentation${env.isDevelopment ? ' (Development)' : env.isStaging ? ' (Staging)' : ''}`,
    customfavIcon: '/sptm-logo.svg',
    swaggerOptions,
    explorer: true  // Enable the explorer panel
  };
};

// Export individual customization functions for flexibility
export const getEnvironmentCSS = (env: EnvironmentConfig): string => {
  if (env.isDevelopment) {
    return DEVELOPMENT_CUSTOMIZATIONS;
  } else if (env.isProduction) {
    return PRODUCTION_CUSTOMIZATIONS;
  } else if (env.isStaging) {
    return STAGING_CUSTOMIZATIONS;
  }
  return '';
};

// Authentication configuration for interactive testing
export interface AuthenticationConfig {
  persistAuthorization: boolean;
  preauthorizeBasic: boolean;
  preauthorizeApiKey: boolean;
}

export const createAuthenticationConfig = (env: EnvironmentConfig): AuthenticationConfig => {
  return {
    persistAuthorization: true,           // Keep auth tokens between page refreshes
    preauthorizeBasic: false,             // Don't pre-authorize basic auth
    preauthorizeApiKey: false             // Don't pre-authorize API keys
  };
};

// Check if Swagger should be enabled based on environment
export const isSwaggerEnabled = (env: EnvironmentConfig): boolean => {
  // Check environment variable first
  const swaggerEnabled = process.env.SWAGGER_ENABLED;
  if (swaggerEnabled !== undefined) {
    return swaggerEnabled.toLowerCase() === 'true';
  }
  
  // Default behavior: enabled in development and staging, disabled in production
  return env.isDevelopment || env.isStaging;
};

// Get environment-specific configuration summary
export const getEnvironmentSummary = (env: EnvironmentConfig): string => {
  const features = [];
  
  if (env.isDevelopment) {
    features.push('🔧 Development Mode');
    features.push('📝 Extended Logging');
    features.push('🧪 All HTTP Methods Enabled');
    features.push('🔍 Operation IDs Visible');
    features.push('📊 Request Details Shown');
  }
  
  if (env.isStaging) {
    features.push('🧪 Staging Mode');
    features.push('🔒 Limited HTTP Methods');
    features.push('📋 Production-like Behavior');
  }
  
  if (env.isProduction) {
    features.push('🚀 Production Mode');
    features.push('🔒 Security Optimized');
    features.push('📋 Read-only Operations');
    features.push('🚫 Validation Disabled');
  }
  
  return features.join(' • ');
};

// Export types for external use
export type { SwaggerUIOptions, SwaggerUISwaggerOptions };

// Default export for easy importing
export default createSwaggerUIOptions;