const ITEM_ZOOM_SIZE_X = 150;
const ITEM_ZOOM_SIZE_Y = 150;
const ITEM_REGION_SIZE_X = 20;
const ITEM_REGION_SIZE_Y = 20;

class ImageController {
  /** @type {HTMLInputElement} */ #inputElement;
  /** @type {HTMLInputElement} */ #zoomChangerElement;
  /** @type {HTMLImageElement} */ #itemElement;
  /** @type {HTMLDivElement} */ #itemRegionElement;
  /** @type {HTMLDivElement} */ #itemZoomElement;
  /** @type {HTMLImageElement} */ #itemZoomedElement;
  /** @type {ImageControllerCollection} */ #collection;
  /** @type {DOMRect} */ #itemRect;
  /** @type {Number} */ #scaleX;
  /** @type {Number} */ #scaleY;
  /** @type {Number} */ #cursorX;
  /** @type {Number} */ #cursorY;

  /**
   * @param {HTMLInputElement} inputElement
   * @param {HTMLInputElement} zoomChangerElement
   * @param {HTMLDivElement} containerElement
   */
  constructor(inputElement, zoomChangerElement, containerElement) {
    this.#inputElement = inputElement;
    this.#zoomChangerElement = zoomChangerElement;
    this.#itemElement = containerElement.querySelector(".image-item");
    this.#itemRegionElement =
      containerElement.querySelector(".image-item-region");
    this.#itemZoomElement = containerElement.querySelector(".image-item-zoom");
    this.#itemZoomedElement =
      containerElement.querySelector(".image-item-zoomed");

    this.#inputElement.addEventListener(
      "change",
      this.#OnInputElementChange.bind(this)
    );

    this.#zoomChangerElement.addEventListener(
      "change",
      this.#OnZoomChangerElementChange.bind(this)
    );

    this.#itemElement.addEventListener(
      "mousemove",
      this.#OnItemElementMouseMove.bind(this)
    );
    this.#itemElement.addEventListener(
      "touchmove",
      this.#OnItemElementTouchMove.bind(this)
    );
    this.#itemElement.addEventListener(
      "load",
      this.#OnItemElementResize.bind(this)
    );
    this.#itemElement.addEventListener(
      "resize",
      this.#OnItemElementResize.bind(this)
    );

    window.addEventListener("resize", this.#OnItemElementResize.bind(this));
  }

  get Collection() {
    return this.#collection;
  }
  set Collection(value) {
    this.#collection = value;
  }

  /**
   * @param {Number} cursorX
   * @param {Number} cursorY
   */
  Move(cursorX, cursorY) {
    if (!this.#itemRect) return;

    const x = -cursorX * this.#scaleX + ITEM_ZOOM_SIZE_X / 2;
    const y = -cursorY * this.#scaleY + ITEM_ZOOM_SIZE_Y / 2;

    this.#itemRegionElement.style.transform = `translate(${cursorX}px, ${
      cursorY - ITEM_REGION_SIZE_Y
    }px)`;
    this.#itemZoomElement.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
    this.#itemZoomedElement.style.transform = `translate(${x}px, ${y}px)`;
  }

  #UpdateScale() {
    this.#itemZoomedElement.style.width = `${
      this.#itemZoomedElement.naturalWidth * this.#zoomChangerElement.value
    }px`;
    this.#itemZoomedElement.style.height = `${
      this.#itemZoomedElement.naturalHeight * this.#zoomChangerElement.value
    }px`;

    this.#scaleX =
      this.#itemZoomedElement.clientWidth / this.#itemElement.clientWidth;
    this.#scaleY =
      this.#itemZoomedElement.clientHeight / this.#itemElement.clientHeight;
    this.#itemRect = this.#itemElement.getBoundingClientRect();

    this.#UpdatePosition();
  }

  #UpdatePosition() {
    if (this.#collection)
      this.#collection.MoveAll(this.#cursorX, this.#cursorY);
    else this.Move(this.#cursorX, this.#cursorY);
  }

  /**
   * @param {Event} e
   */
  #OnInputElementChange(e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const imageUrl = e.target.result;

      this.#itemElement.src = imageUrl;
      this.#itemZoomedElement.src = imageUrl;
    };

    reader.readAsDataURL(file);
  }

  /**
   * @param {Event} e
   */
  #OnZoomChangerElementChange(e) {
    this.#UpdateScale();
  }

  /**
   * @param {TouchEvent} e
   */
  #OnItemElementTouchMove(e) {
    this.#SetCursorPosition(e.touches[0].clientX, e.touches[0].clientY);
    this.#UpdatePosition();
  }

  /**
   * @param {MouseEvent} e
   */
  #OnItemElementMouseMove(e) {
    this.#SetCursorPosition(e.clientX, e.clientY);
    this.#UpdatePosition();
  }

  /**
   * @param {Number} clientX
   * @param {Number} clientY
   */
  #SetCursorPosition(clientX, clientY) {
    this.#cursorX = clientX - this.#itemRect.left + window.scrollX;
    this.#cursorY = clientY - this.#itemRect.top + window.scrollY;
  }

  /**
   * @param {Event} e
   */
  #OnItemElementResize(e) {
    this.#UpdateScale();
  }
}

class ImageControllerCollection {
  /** @type {ImageController[]} */ #items = [];

  /**
   * @param {HTMLInputElement} inputElement
   * @param {HTMLInputElement} zoomChangerElement
   * @param {HTMLDivElement} containerElement
   */
  Add(inputElement, zoomChangerElement, containerElement) {
    const controller = new ImageController(
      inputElement,
      zoomChangerElement,
      containerElement
    );

    controller.Collection = this;

    this.#items.push(controller);
  }

  /**
   * @param {Number} cursorX
   * @param {Number} cursorY
   */
  MoveAll(cursorX, cursorY) {
    for (let item of this.#items) item.Move(cursorX, cursorY);
  }
}

const collection = new ImageControllerCollection();

collection.Add(
  document.getElementById("image-input-1"),
  document.getElementById("image-zoom-changer-1"),
  document.getElementById("image-container-1")
);
collection.Add(
  document.getElementById("image-input-2"),
  document.getElementById("image-zoom-changer-2"),
  document.getElementById("image-container-2")
);
