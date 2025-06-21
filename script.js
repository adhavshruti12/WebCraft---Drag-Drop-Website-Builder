class WebsiteBuilder {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.propertiesPanel = document.getElementById('propertiesPanel');
        this.propertiesContent = document.getElementById('propertiesContent');
        this.dropIndicator = document.getElementById('dropIndicator');
        this.selectedElement = null;
        this.elementCounter = 0;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.hideCanvasPlaceholder();
    }

    setupEventListeners() {
        // Device selector
        document.querySelectorAll('.device-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.device-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.changeCanvasSize(e.target.dataset.device);
            });
        });

        // Preview button
        document.getElementById('previewBtn').addEventListener('click', () => {
            this.showPreview();
        });

        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportHTML();
        });

        // Close properties panel
        document.getElementById('closeProperties').addEventListener('click', () => {
            this.closePropertiesPanel();
        });

        // Close preview modal
        document.getElementById('closePreview').addEventListener('click', () => {
            this.closePreview();
        });

        // Canvas click handler
        this.canvas.addEventListener('click', (e) => {
            if (e.target === this.canvas) {
                this.deselectElement();
            }
        });
    }

    setupDragAndDrop() {
        // Make elements draggable
        document.querySelectorAll('.element-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.target.dataset.type);
                e.target.classList.add('dragging');
            });

            item.addEventListener('dragend', (e) => {
                e.target.classList.remove('dragging');
            });
        });

        // Canvas drop zone
        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.canvas.classList.add('drag-over');
            this.showDropIndicator(e);
        });

        this.canvas.addEventListener('dragleave', (e) => {
            if (!this.canvas.contains(e.relatedTarget)) {
                this.canvas.classList.remove('drag-over');
                this.hideDropIndicator();
            }
        });

        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            this.canvas.classList.remove('drag-over');
            this.hideDropIndicator();
            
            const elementType = e.dataTransfer.getData('text/plain');
            if (elementType) {
                this.createElement(elementType, e);
            }
        });
    }

    showDropIndicator(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.dropIndicator.style.left = `${rect.left + x - 50}px`;
        this.dropIndicator.style.top = `${rect.top + y - 25}px`;
        this.dropIndicator.style.width = '100px';
        this.dropIndicator.style.height = '50px';
        this.dropIndicator.classList.add('show');
    }

    hideDropIndicator() {
        this.dropIndicator.classList.remove('show');
    }

    createElement(type, event) {
        this.elementCounter++;
        const element = document.createElement('div');
        element.className = 'canvas-element';
        element.dataset.type = type;
        element.dataset.id = `element-${this.elementCounter}`;

        // Create element controls
        const controls = document.createElement('div');
        controls.className = 'element-controls';
        controls.innerHTML = `
            <button class="element-control-btn edit" title="Edit">
                <i class="fas fa-edit"></i>
            </button>
            <button class="element-control-btn delete" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        `;
        element.appendChild(controls);

        // Create element content based on type
        let content = '';
        switch (type) {
            case 'text':
                content = '<div class="canvas-text">Sample text content. Click to edit.</div>';
                break;
            case 'heading':
                content = '<h2 class="canvas-heading">Your Heading Here</h2>';
                break;
            case 'image':
                content = '<img class="canvas-image" src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400" alt="Sample Image">';
                break;
            case 'button':
                content = '<button class="canvas-button">Click Me</button>';
                break;
            case 'container':
                content = '<div class="canvas-container-element">Container - Drop elements here</div>';
                break;
            case 'divider':
                content = '<div class="canvas-divider"></div>';
                break;
        }

        element.innerHTML = controls.outerHTML + content;

        // Position element
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        element.style.position = 'absolute';
        element.style.left = `${Math.max(0, x - 50)}px`;
        element.style.top = `${Math.max(0, y - 25)}px`;

        // Add event listeners
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectElement(element);
        });

        // Control button events
        element.querySelector('.edit').addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectElement(element);
        });

        element.querySelector('.delete').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteElement(element);
        });

        this.canvas.appendChild(element);
        this.hideCanvasPlaceholder();
        this.selectElement(element);

        // Make the element draggable after adding to canvas
        this.makeElementDraggable(element);
    }

    selectElement(element) {
        // Remove previous selection
        document.querySelectorAll('.canvas-element.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // Select new element
        element.classList.add('selected');
        this.selectedElement = element;
        this.showPropertiesPanel();
        this.loadElementProperties();
    }

    deselectElement() {
        if (this.selectedElement) {
            this.selectedElement.classList.remove('selected');
            this.selectedElement = null;
            this.closePropertiesPanel();
        }
    }

    deleteElement(element) {
        if (element === this.selectedElement) {
            this.selectedElement = null;
            this.closePropertiesPanel();
        }
        element.remove();
        this.checkCanvasEmpty();
    }

    showPropertiesPanel() {
        this.propertiesPanel.classList.add('open');
    }

    closePropertiesPanel() {
        this.propertiesPanel.classList.remove('open');
    }

    loadElementProperties() {
        if (!this.selectedElement) return;

        const type = this.selectedElement.dataset.type;
        let propertiesHTML = '';

        switch (type) {
            case 'text':
                const textElement = this.selectedElement.querySelector('.canvas-text');
                propertiesHTML = `
                    <div class="property-group">
                        <h4>Text Properties</h4>
                        <div class="property-field">
                            <label>Content</label>
                            <textarea id="textContent">${textElement.textContent}</textarea>
                        </div>
                        <div class="property-field">
                            <label>Font Size</label>
                            <input type="number" id="fontSize" value="${parseInt(getComputedStyle(textElement).fontSize)}" min="8" max="72">
                        </div>
                        <div class="property-field">
                            <label>Text Color</label>
                            <div class="color-input-group">
                                <input type="color" id="textColor" value="${this.rgbToHex(getComputedStyle(textElement).color)}">
                                <input type="text" id="textColorHex" value="${this.rgbToHex(getComputedStyle(textElement).color)}">
                            </div>
                        </div>
                        <div class="property-field">
                            <label>Font Weight</label>
                            <select id="fontWeight">
                                <option value="300">Light</option>
                                <option value="400" selected>Normal</option>
                                <option value="500">Medium</option>
                                <option value="600">Semi Bold</option>
                                <option value="700">Bold</option>
                            </select>
                        </div>
                    </div>
                `;
                break;

            case 'heading':
                const headingElement = this.selectedElement.querySelector('.canvas-heading');
                propertiesHTML = `
                    <div class="property-group">
                        <h4>Heading Properties</h4>
                        <div class="property-field">
                            <label>Content</label>
                            <input type="text" id="headingContent" value="${headingElement.textContent}">
                        </div>
                        <div class="property-field">
                            <label>Heading Level</label>
                            <select id="headingLevel">
                                <option value="h1">H1</option>
                                <option value="h2" selected>H2</option>
                                <option value="h3">H3</option>
                                <option value="h4">H4</option>
                                <option value="h5">H5</option>
                                <option value="h6">H6</option>
                            </select>
                        </div>
                        <div class="property-field">
                            <label>Font Size</label>
                            <input type="number" id="headingFontSize" value="${parseInt(getComputedStyle(headingElement).fontSize)}" min="16" max="72">
                        </div>
                        <div class="property-field">
                            <label>Text Color</label>
                            <div class="color-input-group">
                                <input type="color" id="headingColor" value="${this.rgbToHex(getComputedStyle(headingElement).color)}">
                                <input type="text" id="headingColorHex" value="${this.rgbToHex(getComputedStyle(headingElement).color)}">
                            </div>
                        </div>
                    </div>
                `;
                break;

            case 'image':
                const imgElement = this.selectedElement.querySelector('.canvas-image');
                propertiesHTML = `
                    <div class="property-group">
                        <h4>Image Properties</h4>
                        <div class="property-field">
                            <label>Image URL</label>
                            <input type="url" id="imageUrl" value="${imgElement.src}">
                        </div>
                        <div class="property-field">
                            <label>Alt Text</label>
                            <input type="text" id="imageAlt" value="${imgElement.alt}">
                        </div>
                        <div class="property-field">
                            <label>Width</label>
                            <input type="number" id="imageWidth" value="${imgElement.style.width ? parseInt(imgElement.style.width) : 'auto'}" placeholder="Auto">
                        </div>
                        <div class="property-field">
                            <label>Border Radius</label>
                            <input type="number" id="imageBorderRadius" value="8" min="0" max="50">
                        </div>
                    </div>
                `;
                break;

            case 'button':
                const buttonElement = this.selectedElement.querySelector('.canvas-button');
                propertiesHTML = `
                    <div class="property-group">
                        <h4>Button Properties</h4>
                        <div class="property-field">
                            <label>Button Text</label>
                            <input type="text" id="buttonText" value="${buttonElement.textContent}">
                        </div>
                        <div class="property-field">
                            <label>Background Color</label>
                            <div class="color-input-group">
                                <input type="color" id="buttonBgColor" value="${this.rgbToHex(getComputedStyle(buttonElement).backgroundColor)}">
                                <input type="text" id="buttonBgColorHex" value="${this.rgbToHex(getComputedStyle(buttonElement).backgroundColor)}">
                            </div>
                        </div>
                        <div class="property-field">
                            <label>Text Color</label>
                            <div class="color-input-group">
                                <input type="color" id="buttonTextColor" value="${this.rgbToHex(getComputedStyle(buttonElement).color)}">
                                <input type="text" id="buttonTextColorHex" value="${this.rgbToHex(getComputedStyle(buttonElement).color)}">
                            </div>
                        </div>
                        <div class="property-field">
                            <label>Font Size</label>
                            <input type="number" id="buttonFontSize" value="${parseInt(getComputedStyle(buttonElement).fontSize)}" min="12" max="24">
                        </div>
                        <div class="property-field">
                            <label>Link URL</label>
                            <input type="url" id="buttonUrl" placeholder="https://example.com">
                        </div>
                    </div>
                `;
                break;

            case 'container':
                const containerElement = this.selectedElement.querySelector('.canvas-container-element');
                propertiesHTML = `
                    <div class="property-group">
                        <h4>Container Properties</h4>
                        <div class="property-field">
                            <label>Background Color</label>
                            <div class="color-input-group">
                                <input type="color" id="containerBgColor" value="${this.rgbToHex(getComputedStyle(containerElement).backgroundColor)}">
                                <input type="text" id="containerBgColorHex" value="${this.rgbToHex(getComputedStyle(containerElement).backgroundColor)}">
                            </div>
                        </div>
                        <div class="property-field">
                            <label>Padding</label>
                            <input type="number" id="containerPadding" value="24" min="0" max="100">
                        </div>
                        <div class="property-field">
                            <label>Border Radius</label>
                            <input type="number" id="containerBorderRadius" value="8" min="0" max="50">
                        </div>
                        <div class="property-field">
                            <label>Min Height</label>
                            <input type="number" id="containerMinHeight" value="100" min="50" max="500">
                        </div>
                    </div>
                `;
                break;

            case 'divider':
                const dividerElement = this.selectedElement.querySelector('.canvas-divider');
                propertiesHTML = `
                    <div class="property-group">
                        <h4>Divider Properties</h4>
                        <div class="property-field">
                            <label>Color</label>
                            <div class="color-input-group">
                                <input type="color" id="dividerColor" value="${this.rgbToHex(getComputedStyle(dividerElement).backgroundColor)}">
                                <input type="text" id="dividerColorHex" value="${this.rgbToHex(getComputedStyle(dividerElement).backgroundColor)}">
                            </div>
                        </div>
                        <div class="property-field">
                            <label>Height</label>
                            <input type="number" id="dividerHeight" value="2" min="1" max="10">
                        </div>
                        <div class="property-field">
                            <label>Margin</label>
                            <input type="number" id="dividerMargin" value="16" min="0" max="50">
                        </div>
                    </div>
                `;
                break;
        }

        this.propertiesContent.innerHTML = propertiesHTML;
        this.setupPropertyListeners();
    }

    setupPropertyListeners() {
        const inputs = this.propertiesContent.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.updateElementProperties();
            });
        });

        // Color picker sync
        const colorInputs = this.propertiesContent.querySelectorAll('input[type="color"]');
        colorInputs.forEach(colorInput => {
            const textInput = colorInput.nextElementSibling;
            colorInput.addEventListener('input', () => {
                textInput.value = colorInput.value;
                this.updateElementProperties();
            });
            textInput.addEventListener('input', () => {
                if (this.isValidHex(textInput.value)) {
                    colorInput.value = textInput.value;
                    this.updateElementProperties();
                }
            });
        });
    }

    updateElementProperties() {
        if (!this.selectedElement) return;

        const type = this.selectedElement.dataset.type;

        switch (type) {
            case 'text':
                const textElement = this.selectedElement.querySelector('.canvas-text');
                const textContent = document.getElementById('textContent');
                const fontSize = document.getElementById('fontSize');
                const textColor = document.getElementById('textColor');
                const fontWeight = document.getElementById('fontWeight');

                if (textContent) textElement.textContent = textContent.value;
                if (fontSize) textElement.style.fontSize = fontSize.value + 'px';
                if (textColor) textElement.style.color = textColor.value;
                if (fontWeight) textElement.style.fontWeight = fontWeight.value;
                break;

            case 'heading':
                const headingElement = this.selectedElement.querySelector('.canvas-heading');
                const headingContent = document.getElementById('headingContent');
                const headingLevel = document.getElementById('headingLevel');
                const headingFontSize = document.getElementById('headingFontSize');
                const headingColor = document.getElementById('headingColor');

                if (headingContent) headingElement.textContent = headingContent.value;
                if (headingLevel && headingElement.tagName.toLowerCase() !== headingLevel.value) {
                    const newHeading = document.createElement(headingLevel.value);
                    newHeading.className = 'canvas-heading';
                    newHeading.textContent = headingElement.textContent;
                    newHeading.style.cssText = headingElement.style.cssText;
                    headingElement.parentNode.replaceChild(newHeading, headingElement);
                }
                if (headingFontSize) headingElement.style.fontSize = headingFontSize.value + 'px';
                if (headingColor) headingElement.style.color = headingColor.value;
                break;

            case 'image':
                const imgElement = this.selectedElement.querySelector('.canvas-image');
                const imageUrl = document.getElementById('imageUrl');
                const imageAlt = document.getElementById('imageAlt');
                const imageWidth = document.getElementById('imageWidth');
                const imageBorderRadius = document.getElementById('imageBorderRadius');

                if (imageUrl) imgElement.src = imageUrl.value;
                if (imageAlt) imgElement.alt = imageAlt.value;
                if (imageWidth) imgElement.style.width = imageWidth.value ? imageWidth.value + 'px' : 'auto';
                if (imageBorderRadius) imgElement.style.borderRadius = imageBorderRadius.value + 'px';
                break;

            case 'button':
                const buttonElement = this.selectedElement.querySelector('.canvas-button');
                const buttonText = document.getElementById('buttonText');
                const buttonBgColor = document.getElementById('buttonBgColor');
                const buttonTextColor = document.getElementById('buttonTextColor');
                const buttonFontSize = document.getElementById('buttonFontSize');
                const buttonUrl = document.getElementById('buttonUrl');

                if (buttonText) buttonElement.textContent = buttonText.value;
                if (buttonBgColor) buttonElement.style.backgroundColor = buttonBgColor.value;
                if (buttonTextColor) buttonElement.style.color = buttonTextColor.value;
                if (buttonFontSize) buttonElement.style.fontSize = buttonFontSize.value + 'px';
                if (buttonUrl && buttonUrl.value) {
                    buttonElement.onclick = () => window.open(buttonUrl.value, '_blank');
                }
                break;

            case 'container':
                const containerElement = this.selectedElement.querySelector('.canvas-container-element');
                const containerBgColor = document.getElementById('containerBgColor');
                const containerPadding = document.getElementById('containerPadding');
                const containerBorderRadius = document.getElementById('containerBorderRadius');
                const containerMinHeight = document.getElementById('containerMinHeight');

                if (containerBgColor) containerElement.style.backgroundColor = containerBgColor.value;
                if (containerPadding) containerElement.style.padding = containerPadding.value + 'px';
                if (containerBorderRadius) containerElement.style.borderRadius = containerBorderRadius.value + 'px';
                if (containerMinHeight) containerElement.style.minHeight = containerMinHeight.value + 'px';
                break;

            case 'divider':
                const dividerElement = this.selectedElement.querySelector('.canvas-divider');
                const dividerColor = document.getElementById('dividerColor');
                const dividerHeight = document.getElementById('dividerHeight');
                const dividerMargin = document.getElementById('dividerMargin');

                if (dividerColor) dividerElement.style.backgroundColor = dividerColor.value;
                if (dividerHeight) dividerElement.style.height = dividerHeight.value + 'px';
                if (dividerMargin) dividerElement.style.margin = dividerMargin.value + 'px 0';
                break;
        }
    }

    changeCanvasSize(device) {
        this.canvas.className = 'canvas';
        if (device !== 'desktop') {
            this.canvas.classList.add(device);
        }
    }

    showPreview() {
        const modal = document.getElementById('previewModal');
        const frame = document.getElementById('previewFrame');
        
        const canvasHTML = this.generatePreviewHTML();
        const blob = new Blob([canvasHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        frame.src = url;
        modal.classList.add('show');
    }

    closePreview() {
        const modal = document.getElementById('previewModal');
        const frame = document.getElementById('previewFrame');
        
        modal.classList.remove('show');
        URL.revokeObjectURL(frame.src);
        frame.src = 'about:blank';
    }

    generatePreviewHTML() {
        const canvasClone = this.canvas.cloneNode(true);
        
        // Remove editor-specific elements
        canvasClone.querySelectorAll('.element-controls').forEach(el => el.remove());
        canvasClone.querySelectorAll('.canvas-element').forEach(el => {
            el.classList.remove('canvas-element', 'selected');
            el.style.position = 'relative';
            el.style.left = 'auto';
            el.style.top = 'auto';
            el.style.border = 'none';
            el.style.boxShadow = 'none';
        });
        
        // Remove placeholder
        const placeholder = canvasClone.querySelector('.canvas-placeholder');
        if (placeholder) placeholder.remove();

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Generated Website</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
                    .canvas-text { padding: 8px 12px; font-size: 16px; line-height: 1.5; color: #1e293b; }
                    .canvas-heading { padding: 12px; font-size: 32px; font-weight: 700; color: #1e293b; line-height: 1.2; }
                    .canvas-image { max-width: 100%; height: auto; border-radius: 8px; display: block; }
                    .canvas-button { background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: 500; cursor: pointer; transition: all 0.2s ease; }
                    .canvas-button:hover { background: #2563eb; transform: translateY(-1px); }
                    .canvas-container-element { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 24px; min-height: 100px; }
                    .canvas-divider { height: 2px; background: #e2e8f0; margin: 16px 0; border-radius: 1px; }
                </style>
            </head>
            <body>
                ${canvasClone.innerHTML}
            </body>
            </html>
        `;
    }

    exportHTML() {
        const html = this.generatePreviewHTML();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'website.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    hideCanvasPlaceholder() {
        const placeholder = this.canvas.querySelector('.canvas-placeholder');
        if (placeholder && this.canvas.children.length > 1) {
            placeholder.style.display = 'none';
        }
    }

    checkCanvasEmpty() {
        const placeholder = this.canvas.querySelector('.canvas-placeholder');
        const elements = this.canvas.querySelectorAll('.canvas-element');
        
        if (elements.length === 0 && placeholder) {
            placeholder.style.display = 'block';
        }
    }

    rgbToHex(rgb) {
        if (rgb.startsWith('#')) return rgb;
        
        const result = rgb.match(/\d+/g);
        if (!result || result.length < 3) return '#000000';
        
        return '#' + result.slice(0, 3).map(x => {
            const hex = parseInt(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    isValidHex(hex) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
    }

    makeElementDraggable(element) {
        let isDragging = false;
        let offsetX, offsetY;

        element.addEventListener('mousedown', (e) => {
            // Prevent dragging when clicking on control buttons
            if (e.target.closest('.element-controls')) return;
            isDragging = true;
            element.style.zIndex = 1000;
            const rect = element.getBoundingClientRect();
            const canvasRect = this.canvas.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            // Prevent text selection while dragging
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const canvasRect = this.canvas.getBoundingClientRect();
            let x = e.clientX - canvasRect.left - offsetX;
            let y = e.clientY - canvasRect.top - offsetY;

            // Keep element within canvas bounds
            x = Math.max(0, Math.min(x, canvasRect.width - element.offsetWidth));
            y = Math.max(0, Math.min(y, canvasRect.height - element.offsetHeight));

            element.style.left = `${x}px`;
            element.style.top = `${y}px`;
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            element.style.zIndex = '';
            document.body.style.userSelect = '';
        });
    }
}

// Initialize the website builder when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WebsiteBuilder();
});