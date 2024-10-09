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

        let asciidoctor;
        try {
          asciidoctor = Asciidoctor(); // Ensure Asciidoctor.js is loaded
        } catch (e) {
          console.error('Asciidoctor.js is not available. Ensure it is loaded on the page.');
          return;
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
          options.attributes['stylesheet'] = stylesheetUrl;
          options.attributes['linkcss'] = true;
        }

        // Convert the AsciiDoc response to HTML
        const htmlContent = asciidoctor.convert(xhr.responseText, options);
        // Set the content to be swapped into the target element
        evt.detail.content = htmlContent;
      }
    }
  }
});