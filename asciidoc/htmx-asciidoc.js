/**
 * (c) 2024 Mario Toffia
 * 
 * (https://github.com/mariotoffia/htmx-extensions)
 * 
 * Released under the Apache 2.0 License.
 **/
htmx.defineExtension('asciidoc', {
  onEvent: function (name, evt) {
    if (name === "htmx:beforeSwap") {
      const xhr = evt.detail.xhr;

      const contentType = xhr.getResponseHeader('Content-Type');
      if (contentType?.startsWith('text/asciidoc')) {
        const targetElement = evt.detail.target;

        // If target has 'asciidoc-disable', use raw content
        if (targetElement.hasAttribute('asciidoc-disable')) {
          evt.detail.content = xhr.responseText;
          return;
        }

        // If user has custom hooked up it to the window object
        let asciidoctor = window.Asciidoctor;

        if (!asciidoctor) {
          // Check if 3.x style
          if (typeof Asciidoctor$$module$build$asciidoctor_browser === 'function') {
            asciidoctor = Asciidoctor$$module$build$asciidoctor_browser();
          } else {
            // No -> 2.x style          
            if (typeof Asciidoctor === 'undefined') {
              console.error('asciidoctor.js is not available. Ensure it is loaded on the page.');
              return;
            }

            asciidoctor = Asciidoctor();
          }
        }

        // Helper function to retrieve attributes recursively
        const attr = function (node, property) {
          if (!node) { return undefined; }
          return node.getAttribute(property) || node.getAttribute('data-' + property) || attr(node.parentElement, property);
        };

        const attributes = attr(targetElement, 'asciidoc-attributes');
        const options = { attributes: {} };

        if (attributes) {
          attributes.split(',').forEach(function (attrStr) {
            const index = attrStr.indexOf('=');
            let key, value;
            if (index > -1) {
              key = attrStr.slice(0, index).trim();
              value = attrStr.slice(index + 1).trim();
            } else {
              key = attrStr.trim();
              value = '';
            }
            options.attributes[key] = value;
          });
        }

        const stylesheetUrl = attr(targetElement, 'asciidoc-stylesheet');
        if (stylesheetUrl) {
          // Fetch the stylesheet and scope the styles
          fetch(stylesheetUrl)
            .then(response => response.text())
            .then(cssContent => {
              // Prefix all CSS selectors with the target element's ID or class
              const scopedCssContent = cssContent.replace(/(^|\s)([^\s,{]+)/g, `$1#${targetElement.id} $2`);
              // Create a <style> element and inject the scoped CSS content into the target element
              const styleTag = document.createElement('style');
              styleTag.textContent = scopedCssContent;
              targetElement.prepend(styleTag);
            })
            .catch(error => {
              console.error('Failed to load stylesheet:', stylesheetUrl, error);
            });
        }

        // Convert the AsciiDoc response to HTML
        const htmlContent = asciidoctor.convert(xhr.responseText, options);
        // Set the content to be swapped into the target element
        evt.detail.serverResponse = htmlContent;
      }
    }
  }
});