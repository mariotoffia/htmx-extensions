/**
 * (c) 2024 Mario Toffia
 * 
 * (https://github.com/mariotoffia/htmx-extensions)
 * 
 * Released under the Apache 2.0 License.
 * 
 * This is a simple HTMX extension that allows you to render AsciiDoc content when the server returns 
 * a response with the Content-Type of 'text/asciidoc'.
 * 
 * To use this extension, include the following script tag in your HTML:
 * 
 * <script src="https://cdn.jsdelivr.net/npm/asciidoctor@2.2.8/dist/browser/asciidoctor.js"></script>
 * <script src="hx-asciidoc.js"></script>
 * 
 * Then, whenever you make an HTMX request that returns AsciiDoc content, the extension will render
 * the content as HTML. You can also pass in AsciiDoc attributes by adding an `asciidoc-attributes`.
 * 
 * For example:
 * 
 * <button hx-ext="asciidoc" hx-get="/path/to/your.asciidoc" hx-target="#content" hx-swap="innerHTML" asciidoc-attributes="showtitle=true,sectnums=true">
 *   Load AsciiDoc
 * </button>
 * <div id="content"></div>
 * 
 * NOTE: If the _asciidoc-disable_ attribute is present on the target element, the AsciiDoc content will be passed directly.
 **/
htmx.defineExtension('asciidoc', {
  onEvent: function (name, evt) {
    if (name === "htmx:beforeSwap") {
      var xhr = evt.detail.xhr;

      var contentType = xhr.getResponseHeader('Content-Type');
      if (contentType && contentType.startsWith('text/asciidoc')) {
        var targetElement = evt.detail.target;

        // target has 'asciidoc-disable' -> raw content
        if (targetElement.hasAttribute('asciidoc-disable')) {
          evt.detail.swapContent = xhr.responseText;
          return; // Exit early without rendering the content
        }

        try {
          var asciidoctor = Asciidoctor(); // Ensure Asciidoctor.js is loaded
        } catch (e) {
          console.error('Asciidoctor.js is not available. Ensure it is loaded on the page.');
          return;
        }

        // Helper function to retrieve attributes recursively
        var attr = function (node, property) {
          if (node == undefined) { return undefined }
          return node.getAttribute(property) || node.getAttribute('data-' + property) || attr(node.parentElement, property);
        }
        var attributes = attr(targetElement, 'asciidoc-attributes');
        var options = { attributes: {} };

        if (attributes) {
          attributes.split(',').forEach(function (attr) {
            var [key, value] = attr.split('=');
            if (value === undefined) {
              options.attributes[key.trim()] = '';
            } else {
              options.attributes[key.trim()] = value.trim();
            }
          });
        }

        var stylesheetUrl = attr(targetElement, 'asciidoc-stylesheet');
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
        var htmlContent = asciidoctor.convert(xhr.responseText, options);
        // Set the content to be swapped into the target element
        evt.detail.serverResponse = htmlContent;
      }
    }
  }
});