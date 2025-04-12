const ITEM_ZOOM_SIZE_X = 150;
const ITEM_ZOOM_SIZE_Y = 150;
const ITEM_REGION_SIZE_X = 20;
const ITEM_REGION_SIZE_Y = 20;

class ImageController {
    #inputElement;
    #itemElement;
    #itemRegionElement;
    #itemZoomElement;
    #itemZoomedElement;
    #collection;
    #itemRect;
    #scaleX;
    #scaleY;
    #cursorX;
    #cursorY;
    #isHovered = false;

    constructor(inputElement, containerElement) {
        this.#inputElement = inputElement;
        this.#itemElement = containerElement.querySelector(".image-item");
        this.#itemRegionElement = containerElement.querySelector(".image-item-region");
        this.#itemZoomElement = containerElement.querySelector(".image-item-zoom");
        this.#itemZoomedElement = containerElement.querySelector(".image-item-zoomed");

        this.#inputElement.addEventListener("change", this.#OnInputElementChange.bind(this));
        this.#itemElement.addEventListener("mousemove", this.#OnItemElementMouseMove.bind(this));
        this.#itemElement.addEventListener("mouseleave", this.#OnMouseLeave.bind(this));
        this.#itemElement.addEventListener("touchmove", this.#OnItemElementTouchMove.bind(this), { passive: true });
        this.#itemElement.addEventListener("load", this.#OnItemElementResize.bind(this), { passive: true });
        this.#itemElement.addEventListener("mouseenter", this.#OnMouseEnter.bind(this));
        window.addEventListener("resize", this.#OnItemElementResize.bind(this), { passive: true });
    }

    get Collection() { return this.#collection; }
    set Collection(value) { this.#collection = value; }

    Move(cursorX, cursorY) {
        if (!this.#itemRect || !this.#isHovered) return;

        const regionX = cursorX - ITEM_REGION_SIZE_X / 2;
        const regionY = cursorY - ITEM_REGION_SIZE_Y / 2;
        const squareRight = regionX + ITEM_REGION_SIZE_X;
        const squareBottom = regionY + ITEM_REGION_SIZE_Y;
        const offsetX = 10;
        const offsetY = 10;
        const zoomX = squareRight + offsetX;
        const zoomY = squareBottom + offsetY;
        const x = -cursorX * this.#scaleX + ITEM_ZOOM_SIZE_X / 2;
        const y = -cursorY * this.#scaleY + ITEM_ZOOM_SIZE_Y / 2;

        this.#itemRegionElement.style.transform = `translate(${regionX}px, ${regionY}px)`;
        this.#itemZoomElement.style.transform = `translate(${zoomX}px, ${zoomY}px)`;
        this.#itemZoomedElement.style.transform = `translate(${x}px, ${y}px)`;
    }

    UpdateScale(scale) {
        const zoomValue = document.getElementById("zoom-value");
        const baseZoomSize = Math.min(ITEM_ZOOM_SIZE_X, ITEM_ZOOM_SIZE_Y) * 6;
        
        if (!this.#itemZoomedElement.naturalWidth) return;
        
        const imageAspectRatio = this.#itemZoomedElement.naturalWidth / this.#itemZoomedElement.naturalHeight;
        const normalizedScale = scale * (baseZoomSize / Math.max(this.#itemZoomedElement.naturalWidth, this.#itemZoomedElement.naturalHeight * imageAspectRatio));

        this.#itemZoomedElement.style.width = `${this.#itemZoomedElement.naturalWidth * normalizedScale}px`;
        this.#itemZoomedElement.style.height = `${this.#itemZoomedElement.naturalHeight * normalizedScale}px`;

        this.#scaleX = this.#itemZoomedElement.clientWidth / this.#itemElement.clientWidth;
        this.#scaleY = this.#itemZoomedElement.clientHeight / this.#itemElement.clientHeight;
        this.#itemRect = this.#itemElement.getBoundingClientRect();

        zoomValue.textContent = `x${scale.toFixed(1)}`;

        this.#UpdatePosition();
    }

    #UpdatePosition() {
        if (this.#collection) this.#collection.MoveAll(this.#cursorX, this.#cursorY);
        else this.Move(this.#cursorX, this.#cursorY);
    }

    #OnInputElementChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        const dropZone = this.#itemElement.closest(".image-container").querySelector(".drop-zone");

        reader.onload = (e) => {
            const imageUrl = e.target.result;
            this.#itemElement.src = imageUrl;
            this.#itemZoomedElement.src = imageUrl;

            this.#itemRegionElement.style.display = "block";
            this.#itemZoomElement.style.display = "none";
            this.#itemZoomedElement.style.display = "none";
            this.#itemRegionElement.style.display = "block";

            const fileInfo = this.#inputElement.closest(".image-container").querySelector(".file-info");
            const size = (file.size / (1024 * 1024)).toFixed(2) + " МБ";
            const name = file.name;
            const img = new Image();
            img.onload = () => {
                fileInfo.textContent = `Имя: ${name} | Размер: ${size} | Разрешение: ${img.width}x${img.height} | Формат: ${file.type.split('/')[1]}`;
            };
            img.src = imageUrl;

            dropZone.classList.add("hidden");
        };

        reader.readAsDataURL(file);
    }

    #OnItemElementTouchMove(e) {
        e.preventDefault();
        this.#SetCursorPosition(e.touches[0].clientX, e.touches[0].clientY);
        this.#UpdatePosition();
        this.#ShowZoomElements();
    }

    #OnItemElementMouseMove(e) {
        this.#SetCursorPosition(e.clientX, e.clientY);
        this.#UpdatePosition();
        this.#ShowZoomElements();
    }

    #OnMouseEnter() {
        this.#isHovered = true;
        this.#ShowZoomElements();
    }

    #OnMouseLeave() {
        this.#isHovered = false;
        this.#HideZoomElements();
    }

    #ShowZoomElements() {
        if (this.#itemElement.src && this.#isHovered) {
            this.#itemZoomElement.style.display = "block";
            this.#itemZoomedElement.style.display = "block";
            this.#itemRegionElement.style.display = "block";
        }
    }

    #HideZoomElements() {
        this.#itemZoomElement.style.display = "none";
        this.#itemZoomedElement.style.display = "none";
        this.#itemRegionElement.style.display = "none";
    }

    #SetCursorPosition(clientX, clientY) {
        if (!this.#itemRect) return;
        
        this.#cursorX = clientX - this.#itemRect.left;
        this.#cursorY = clientY - this.#itemRect.top;
        
        this.#cursorX = Math.max(0, Math.min(this.#cursorX, this.#itemRect.width));
        this.#cursorY = Math.max(0, Math.min(this.#cursorY, this.#itemRect.height));
    }

    #OnItemElementResize() {
        const currentScale = parseFloat(document.getElementById("image-zoom-changer").value);
        this.#itemRect = this.#itemElement.getBoundingClientRect();
        this.UpdateScale(currentScale);
    }
}

class ImageControllerCollection {
    constructor() {
        this._items = [];
    }

    Add(inputElement, containerElement) {
        const controller = new ImageController(inputElement, containerElement);
        controller.Collection = this;
        this._items.push(controller);
    }

    MoveAll(cursorX, cursorY) {
        for (let item of this._items) item.Move(cursorX, cursorY);
    }

    updateAllScale(scale) {
        for (let item of this._items) item.UpdateScale(scale);
    }
}

const collection = new ImageControllerCollection();

collection.Add(
    document.getElementById("image-input-1"),
    document.getElementById("image-container-1")
);
collection.Add(
    document.getElementById("image-input-2"),
    document.getElementById("image-container-2")
);

const zoomChanger = document.getElementById("image-zoom-changer");
const zoomContainer = document.querySelector(".single-zoom");

zoomChanger.addEventListener("input", (e) => {
    const scale = parseFloat(e.target.value);
    collection.updateAllScale(scale);
});

const zoomButtons = document.querySelectorAll(".zoom-btn");
zoomButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const step = parseFloat(btn.dataset.step);
        const newValue = Math.min(3, Math.max(0.1, parseFloat(zoomChanger.value) + step));
        zoomChanger.value = newValue;
        collection.updateAllScale(newValue);
    });
});

let wheelTimeout;
zoomContainer.addEventListener("wheel", (e) => {
    e.preventDefault();
    clearTimeout(wheelTimeout);

    const step = e.deltaY > 0 ? -0.1 : 0.1;
    const newValue = Math.min(3, Math.max(0.1, parseFloat(zoomChanger.value) + step));
    zoomChanger.value = newValue;
    collection.updateAllScale(newValue);

    wheelTimeout = setTimeout(() => {}, 100);
}, { passive: false });

const dropZones = {
    1: { zone: document.getElementById("drop-zone-1"), input: document.getElementById("image-input-1") },
    2: { zone: document.getElementById("drop-zone-2"), input: document.getElementById("image-input-2") }
};

Object.values(dropZones).forEach(({ zone, input }) => {
    zone.addEventListener("dragover", (e) => {
        e.preventDefault();
        zone.classList.add("dragover");
    });

    zone.addEventListener("dragleave", () => {
        zone.classList.remove("dragover");
    });

    zone.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.classList.remove("dragover");
        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith("image/"));
        if (files.length > 0) {
            const file = files[0];
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            input.files = dataTransfer.files;
            input.dispatchEvent(new Event("change"));
        }
    });

    zone.addEventListener("click", () => {
        input.click();
    });
});
