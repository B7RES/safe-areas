document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const imageUpload = document.getElementById('imageUpload');
    const addSafeAreaBtn = document.getElementById('addSafeArea');
    const deleteSafeAreaBtn = document.getElementById('deleteSafeArea');

    let image = null;
    let safeAreas = [];
    let selectedAreaIndex = -1;

    const handleSize = 8;

    
    function updateButtonStates() {
        addSafeAreaBtn.disabled = !image;
        deleteSafeAreaBtn.disabled = selectedAreaIndex < 0;
    }

    
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                image = new Image();
                image.onload = () => {

                    const imgAspectRatio = image.width / image.height;


                    const container = document.querySelector('.canvas-container');
                    const maxWidth = container.clientWidth;
                    const maxHeight = container.clientHeight;


                    let canvasWidth, canvasHeight;
                    // Calcola le dimensioni del canvas mantenendo le proporzioni dell'immagine
                    if (image.width <= maxWidth && image.height <= maxHeight) {

                        canvasWidth = image.width;
                        canvasHeight = image.height;
                    } else {

                        const containerAspectRatio = maxWidth / maxHeight;

                        if (imgAspectRatio > containerAspectRatio) {

                            canvasWidth = maxWidth;
                            canvasHeight = maxWidth / imgAspectRatio;
                        } else {

                            canvasHeight = maxHeight;
                            canvasWidth = maxHeight * imgAspectRatio;
                        }
                    }

                    canvas.width = canvasWidth;
                    canvas.height = canvasHeight;

                    safeAreas = [];
                    selectedAreaIndex = -1;

                    addSafeAreaBtn.disabled = false;

                    addNewSafeArea();

                    updateButtonStates();
                    drawCanvas();
                };
                image.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });


    addSafeAreaBtn.addEventListener('click', () => {
        if (!image) return;
        addNewSafeArea();
        drawCanvas();
    });

    function addNewSafeArea() {
        const defaultWidth = Math.min(200, image.width / 2);
        const defaultHeight = Math.min(200, image.height / 2);

        const newSafeArea = {
            x: (image.width - defaultWidth) / 2,
            y: (image.height - defaultHeight) / 2,
            width: defaultWidth,
            height: defaultHeight,
            dragging: false,
            resizing: false,
            resizeHandle: null
        };

        constrainAreaToBounds(newSafeArea);
        safeAreas.push(newSafeArea);
        selectedAreaIndex = safeAreas.length - 1;
    }

    function deleteSelectedSafeArea() {
        if (selectedAreaIndex >= 0) {
            safeAreas.splice(selectedAreaIndex, 1);

            if (safeAreas.length > 0) {
                if (selectedAreaIndex >= safeAreas.length) {
                    selectedAreaIndex = safeAreas.length - 1;
                }
            } else {
                selectedAreaIndex = -1;
            }

            updateButtonStates();
            drawCanvas();
        }
    }

    deleteSafeAreaBtn.addEventListener('click', deleteSelectedSafeArea);

    document.addEventListener('keydown', (e) => {
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAreaIndex >= 0) {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                deleteSelectedSafeArea();
                e.preventDefault();
            }
        }
    });

    function constrainAreaToBounds(area) {
        if (area.x < 0) area.x = 0;
        if (area.y < 0) area.y = 0;

        if (area.x + area.width > canvas.width) {

            if (area.width > canvas.width) {
                area.width = canvas.width;
                area.x = 0;
            } else {
                area.x = canvas.width - area.width;
            }
        }

        if (area.y + area.height > canvas.height) {

            if (area.height > canvas.height) {
                area.height = canvas.height;
                area.y = 0;
            } else {
                area.y = canvas.height - area.height;
            }
        }

        area.width = Math.max(area.width, 20);
        area.height = Math.max(area.height, 20);

        return area;
    }


    function drawCanvas() {
        if (!image) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        safeAreas.forEach((area, index) => {
            if (index === selectedAreaIndex) {
                ctx.fillStyle = 'rgba(255, 220, 100, 0.2)';
                ctx.strokeStyle = 'rgba(255, 180, 0, 0.9)';
                ctx.lineWidth = 3;
            } else {
                ctx.fillStyle = 'rgba(100, 170, 255, 0.2)';
                ctx.strokeStyle = 'rgba(0, 125, 255, 0.8)';
                ctx.lineWidth = 2;
            }
            ctx.fillRect(area.x, area.y, area.width, area.height);
            ctx.strokeRect(area.x, area.y, area.width, area.height);

            if (index === selectedAreaIndex) {
                drawResizeHandles(area);
            }
        });
    }

    function drawResizeHandles(area) {
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'rgba(255, 200, 0, 0.9)';
        ctx.lineWidth = 1;

        drawHandle(area.x, area.y);
        drawHandle(area.x + area.width, area.y);
        drawHandle(area.x, area.y + area.height);
        drawHandle(area.x + area.width, area.y + area.height);

        drawHandle(area.x + area.width / 2, area.y);
        drawHandle(area.x + area.width / 2, area.y + area.height);
        drawHandle(area.x, area.y + area.height / 2);
        drawHandle(area.x + area.width, area.y + area.height / 2);
    }

    function drawHandle(x, y) {
        ctx.beginPath();
        ctx.arc(x, y, handleSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }


    function getResizeHandle(x, y) {
        if (selectedAreaIndex < 0) return null;

        const area = safeAreas[selectedAreaIndex];
        const handles = [
            { x: area.x, y: area.y, cursor: 'nwse-resize', name: 'top-left' },
            { x: area.x + area.width, y: area.y, cursor: 'nesw-resize', name: 'top-right' },
            { x: area.x, y: area.y + area.height, cursor: 'nesw-resize', name: 'bottom-left' },
            { x: area.x + area.width, y: area.y + area.height, cursor: 'nwse-resize', name: 'bottom-right' },
            { x: area.x + area.width / 2, y: area.y, cursor: 'ns-resize', name: 'top-center' },
            { x: area.x + area.width / 2, y: area.y + area.height, cursor: 'ns-resize', name: 'bottom-center' },
            { x: area.x, y: area.y + area.height / 2, cursor: 'ew-resize', name: 'left-center' },
            { x: area.x + area.width, y: area.y + area.height / 2, cursor: 'ew-resize', name: 'right-center' }
        ];

        for (const handle of handles) {
            if (Math.abs(x - handle.x) <= handleSize && Math.abs(y - handle.y) <= handleSize) {
                return handle;
            }
        }

        return null;
    }

    function getSafeAreaAt(x, y) {

        for (let i = safeAreas.length - 1; i >= 0; i--) {
            const area = safeAreas[i];
            if (x >= area.x && x <= area.x + area.width &&
                y >= area.y && y <= area.y + area.height) {
                return i;
            }
        }
        return -1;
    }


    canvas.addEventListener('mousedown', (e) => {
        if (!image) return;

        const rect = canvas.getBoundingClientRect();

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const handle = getResizeHandle(x, y);
        if (handle) {
            const area = safeAreas[selectedAreaIndex];
            area.resizing = true;
            area.resizeHandle = handle.name;
            canvas.style.cursor = handle.cursor;
            return;
        }

        const areaIndex = getSafeAreaAt(x, y);
        if (areaIndex >= 0) {

            if (areaIndex !== selectedAreaIndex) {
                selectedAreaIndex = areaIndex;
                updateButtonStates();
                drawCanvas();
                return;
            }

            const area = safeAreas[selectedAreaIndex];
            area.dragging = true;
            area.dragStartX = x - area.x;
            area.dragStartY = y - area.y;
            canvas.style.cursor = 'move';
            return;
        }

        selectedAreaIndex = -1;
        updateButtonStates();
        drawCanvas();
        canvas.style.cursor = 'default';
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!image || selectedAreaIndex < 0) return;

        const rect = canvas.getBoundingClientRect();

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        const area = safeAreas[selectedAreaIndex];

        if (area.dragging) {
            area.x = x - area.dragStartX;
            area.y = y - area.dragStartY;

            if (area.x < 0) area.x = 0;
            if (area.y < 0) area.y = 0;
            if (area.x + area.width > canvas.width) area.x = canvas.width - area.width;
            if (area.y + area.height > canvas.height) area.y = canvas.height - area.height;

            drawCanvas();
            return;
        }

        if (area.resizing) {
            // Gestisce il ridimensionamento dell'area sicura attraverso le maniglie
            switch (area.resizeHandle) {
                case 'top-left':
                    const newWidthTL = area.width + (area.x - x);
                    const newHeightTL = area.height + (area.y - y);
                    if (newWidthTL > 20 && x >= 0) {
                        area.x = x;
                        area.width = newWidthTL;
                    }
                    if (newHeightTL > 20 && y >= 0) {
                        area.y = y;
                        area.height = newHeightTL;
                    }
                    break;
                case 'top-right':
                    const newWidthTR = x - area.x;
                    const newHeightTR = area.height + (area.y - y);
                    if (newWidthTR > 20 && x <= canvas.width) {
                        area.width = newWidthTR;
                    }
                    if (newHeightTR > 20 && y >= 0) {
                        area.y = y;
                        area.height = newHeightTR;
                    }
                    break;
                case 'bottom-left':
                    const newWidthBL = area.width + (area.x - x);
                    const newHeightBL = y - area.y;
                    if (newWidthBL > 20 && x >= 0) {
                        area.x = x;
                        area.width = newWidthBL;
                    }
                    if (newHeightBL > 20 && y <= canvas.height) {
                        area.height = newHeightBL;
                    }
                    break;
                case 'bottom-right':
                    const newWidthBR = x - area.x;
                    const newHeightBR = y - area.y;
                    if (newWidthBR > 20 && x <= canvas.width) {
                        area.width = newWidthBR;
                    }
                    if (newHeightBR > 20 && y <= canvas.height) {
                        area.height = newHeightBR;
                    }
                    break;
                case 'top-center':
                    const newHeightTC = area.height + (area.y - y);
                    if (newHeightTC > 20 && y >= 0) {
                        area.y = y;
                        area.height = newHeightTC;
                    }
                    break;
                case 'bottom-center':
                    const newHeightBC = y - area.y;
                    if (newHeightBC > 20 && y <= canvas.height) {
                        area.height = newHeightBC;
                    }
                    break;
                case 'left-center':
                    const newWidthLC = area.width + (area.x - x);
                    if (newWidthLC > 20 && x >= 0) {
                        area.x = x;
                        area.width = newWidthLC;
                    }
                    break;
                case 'right-center':
                    const newWidthRC = x - area.x;
                    if (newWidthRC > 20 && x <= canvas.width) {
                        area.width = newWidthRC;
                    }
                    break;
            }

            constrainAreaToBounds(area);

            drawCanvas();
            return;
        }


        const handle = getResizeHandle(x, y);
        if (handle) {
            canvas.style.cursor = handle.cursor;
            return;
        }


        const hoverAreaIndex = getSafeAreaAt(x, y);
        if (hoverAreaIndex >= 0) {
            canvas.style.cursor = 'move';
        } else {
            canvas.style.cursor = 'default';
        }
    });

    document.addEventListener('mouseup', () => {
        if (selectedAreaIndex >= 0) {
            const area = safeAreas[selectedAreaIndex];
            area.dragging = false;
            area.resizing = false;
        }
    });


});

// Funzione di debug per visualizzare le coordinate del mouse in tempo reale
function debugCoordinates() {

    const debugDiv = document.createElement('div');
    debugDiv.style.position = 'fixed';
    debugDiv.style.top = '10px';
    debugDiv.style.right = '10px';
    debugDiv.style.background = 'rgba(0,0,0,0.7)';
    debugDiv.style.color = 'white';
    debugDiv.style.padding = '10px';
    debugDiv.style.fontFamily = 'monospace';
    debugDiv.style.zIndex = '1000';
    document.body.appendChild(debugDiv);

    // Converte le coordinate del mouse dallo spazio dello schermo allo spazio del canvas
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const rawX = e.clientX - rect.left;
        const rawY = e.clientY - rect.top;
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const scaledX = rawX * scaleX;
        const scaledY = rawY * scaleY;

        debugDiv.textContent = `
        Raw X: ${Math.round(rawX)}
        Raw Y: ${Math.round(rawY)}
        Scaled X: ${Math.round(scaledX)}
        Scaled Y: ${Math.round(scaledY)}
        Scale X: ${scaleX.toFixed(2)}
        Scale Y: ${scaleY.toFixed(2)}
        `;
    });
}


debugCoordinates();