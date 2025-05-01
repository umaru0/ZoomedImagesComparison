const ITEM_ZOOM_SIZE_X = 150;
const ITEM_ZOOM_SIZE_Y = 150;
const ITEM_REGION_SIZE_X = 20;
const ITEM_REGION_SIZE_Y = 20;

class ImageController extends EventTarget {
  /** @type {HTMLInputElement} */ #itemInputElement;
  /** @type {HTMLImageElement} */ #infoElement;
  /** @type {HTMLImageElement} */ #itemElement;
  /** @type {HTMLDivElement} */ #dropareaElement;
  /** @type {HTMLDivElement} */ #itemRegionElement;
  /** @type {HTMLDivElement} */ #itemZoomContainerElement;
  /** @type {HTMLDivElement} */ #itemZoomElement;
  /** @type {HTMLImageElement} */ #itemZoomedElement;
  /** @type {DOMRect} */ #itemRect;
  /** @type {Number} */ #cursorX;
  /** @type {Number} */ #cursorY;
  /** @type {Number} */ #scaleX = 1;
  /** @type {Number} */ #scaleY = 1;
  /** @type {File} */ #file;

  /**
   * @param {HTMLDivElement} containerElement
   */
  constructor(containerElement) {
    super();

    this.#infoElement = containerElement.querySelector(".image-info");
    this.#itemInputElement =
      containerElement.querySelector(".image-item-input");
    this.#itemElement = containerElement.querySelector(".image-item");
    this.#itemRegionElement =
      containerElement.querySelector(".image-item-region");
    this.#itemZoomContainerElement = containerElement.querySelector(
      ".image-item-zoom-container"
    );
    this.#itemZoomElement = containerElement.querySelector(".image-item-zoom");
    this.#itemZoomedElement =
      containerElement.querySelector(".image-item-zoomed");
    this.#dropareaElement = containerElement.querySelector(".image-droparea");

    this.#itemInputElement.addEventListener(
      "change",
      this.#OnItemInputElementChange.bind(this)
    );

    this.#itemElement.addEventListener(
      "mouseenter",
      this.#OnItemElementMouseEnter.bind(this)
    );
    this.#itemElement.addEventListener(
      "mousemove",
      this.#OnItemElementMouseMove.bind(this)
    );
    this.#itemElement.addEventListener(
      "mouseleave",
      this.#OnItemElementMouseLeave.bind(this)
    );
    this.#itemElement.addEventListener(
      "touchmove",
      this.#OnItemElementTouchMove.bind(this)
    );
    this.#itemElement.addEventListener(
      "load",
      this.#OnItemElementLoad.bind(this)
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

    containerElement.addEventListener(
      "click",
      this.#OnContainerElementClick.bind(this)
    );
    containerElement.addEventListener(
      "dragover",
      this.#OnContainerElementDragOver.bind(this)
    );
    containerElement.addEventListener(
      "dragleave",
      this.#OnContainerElementDragLeave.bind(this)
    );
    containerElement.addEventListener(
      "drop",
      this.#OnContainerElementDrop.bind(this)
    );
    containerElement.addEventListener(
      "wheel",
      this.#OnContainerElementWheel.bind(this)
    );

    this.HideUI();
    this.#HideDroparea();
  }

  get Width() {
    return this.#itemElement.clientWidth;
  }

  get Height() {
    return this.#itemElement.clientHeight;
  }

  /**
   * @param {Number} cursorX
   * @param {Number} cursorY
   */
  Move(cursorX, cursorY) {
    this.#cursorX = cursorX;
    this.#cursorY = cursorY;

    this.#UpdateScale();
    this.#UpdatePosition();
  }

  /**
   * @param {Number} scaleX
   * @param {Number} scaleY
   */
  Scale(scaleX, scaleY) {
    this.#scaleX = scaleX;
    this.#scaleY = scaleY;

    this.#UpdateScale();
    this.#UpdatePosition();
  }

  HideUI() {
    this.#itemZoomContainerElement.classList.add("hidden");
  }

  ShowUI() {
    this.#itemZoomContainerElement.classList.remove("hidden");
  }

  #UpdateScale() {
    this.#itemZoomedElement.style.width = `${
      this.#itemElement.clientWidth * this.#scaleX
    }px`;
    this.#itemZoomedElement.style.height = `${
      this.#itemElement.clientHeight * this.#scaleY
    }px`;

    this.#itemRect = this.#itemElement.getBoundingClientRect();
  }

  #UpdatePosition() {
    if (!this.#itemRect) return;

    const x = -this.#cursorX * this.#scaleX + ITEM_ZOOM_SIZE_X / 2;
    const y = -this.#cursorY * this.#scaleY + ITEM_ZOOM_SIZE_Y / 2;

    this.#itemRegionElement.style.transform = `translate(${this.#cursorX}px, ${
      this.#cursorY - ITEM_REGION_SIZE_Y
    }px)`;
    this.#itemZoomElement.style.transform = `translate(${this.#cursorX}px, ${
      this.#cursorY
    }px)`;
    this.#itemZoomedElement.style.transform = `translate(${x}px, ${y}px)`;
  }

  #LoadFile(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
      const imageUrl = e.target.result;

      this.#itemElement.src = imageUrl;
      this.#itemZoomedElement.src = imageUrl;
    };

    reader.readAsDataURL(file);

    this.#file = file;
  }

  /**
   * @param {Number} clientX
   * @param {Number} clientY
   */
  #GetCursorPosition(clientX, clientY) {
    const cursorX = clientX - this.#itemRect.left + window.scrollX;
    const cursorY = clientY - this.#itemRect.top + window.scrollY;

    return { cursorX, cursorY };
  }

  #HideDroparea() {
    this.#dropareaElement.classList.add("hidden");
  }

  #ShowDroparea() {
    this.#dropareaElement.classList.remove("hidden");
  }

  #HideInfo() {
    this.#infoElement.classList.add("hidden");
  }

  #ShowInfo() {
    this.#infoElement.classList.remove("hidden");
  }

  /**
   * @param {Event} e
   */
  #OnItemInputElementChange(e) {
    const file = e.target.files[0];

    if (!file) return;

    this.#LoadFile(file);
  }

  /**
   * @param {TouchEvent} e
   */
  #OnItemElementTouchMove(e) {
    this.dispatchEvent(
      new CustomEvent("move", {
        detail: this.#GetCursorPosition(
          e.touches[0].clientX,
          e.touches[0].clientY
        ),
      })
    );
  }

  #OnItemElementMouseEnter() {
    this.dispatchEvent(new CustomEvent("enter"));
  }

  /**
   * @param {MouseEvent} e
   */
  #OnItemElementMouseMove(e) {
    this.dispatchEvent(
      new CustomEvent("move", {
        detail: this.#GetCursorPosition(e.clientX, e.clientY),
      })
    );
  }

  #OnItemElementMouseLeave() {
    this.dispatchEvent(new CustomEvent("leave"));
  }

  #OnItemElementResize() {
    this.#UpdateScale();
  }

  #OnContainerElementClick() {
    this.#itemInputElement.click();
  }

  /**
   * @param {Event} e
   */
  #OnItemElementLoad(e) {
    const size = (this.#file.size / (1024 * 1024)).toFixed(2) + " МБ";
    const name = this.#file.name;

    this.#infoElement.innerText = `
          Имя: ${name}
          Размер: ${size}
          Разрешение: ${e.target.width}x${e.target.height}
          Формат: ${this.#file.type.split("/")[1]}`;
  }

  /**
   * @param {DragEvent} e
   */
  #OnContainerElementDragOver(e) {
    e.preventDefault();

    this.#HideInfo();
    this.#ShowDroparea();
  }

  #OnContainerElementDragLeave() {
    this.#HideDroparea();
    this.#ShowInfo();
  }

  /**
   * @param {DragEvent} e
   */
  #OnContainerElementDrop(e) {
    e.preventDefault();

    this.#HideDroparea();
    this.#ShowInfo();

    const file = e.dataTransfer.files[0];

    if (!file) return;

    this.#LoadFile(file);
  }

  /**
   * @param {WheelEvent} e
   */
  #OnContainerElementWheel(e) {
    e.preventDefault();

    this.dispatchEvent(
      new CustomEvent("wheel", {
        detail: { deltaX: e.deltaX, deltaY: e.deltaY },
      })
    );
  }
}

class ImageCollectionController {
  /** @type {ImageController[]} */ #items = [];

  /**
   * @param {ZoomController} zoomController
   */
  constructor(zoomController) {
    this.#Scale(zoomController.Value, zoomController.Value);

    zoomController.addEventListener("changed", this.#OnZoomChanged.bind(this));
  }

  /**
   * @param {HTMLDivElement} containerElement
   */
  Add(containerElement) {
    const controller = new ImageController(containerElement);

    controller.addEventListener("enter", this.#OnEnter.bind(this));
    controller.addEventListener("move", this.#OnMove.bind(this));
    controller.addEventListener("leave", this.#OnLeave.bind(this));
    controller.addEventListener("wheel", this.#OnWheel.bind(this));

    this.#items.push(controller);
  }

  /**
   * @param {Number} scaleX
   * @param {Number} scaleY
   */
  #Scale(scaleX, scaleY) {
    for (let item of this.#items) item.Scale(scaleX, scaleY);
  }

  #OnEnter() {
    for (let item of this.#items) item.ShowUI();
  }

  /**
   * @param {CustomEvent} e
   */
  #OnMove(e) {
    for (let item of this.#items) {
      const scaledX = e.detail.cursorX * (item.Width / e.target.Width);
      const scaledY = e.detail.cursorY * (item.Height / e.target.Height);

      item.Move(scaledX, scaledY);
    }
  }

  #OnLeave() {
    for (let item of this.#items) item.HideUI();
  }

  /**
   * @param {CustomEvent} e
   */
  #OnWheel(e) {
    if (e.detail.deltaY > 0) zoomController.StepForward();
    else if (e.detail.deltaY < 0) zoomController.StepBack();
  }

  #OnZoomChanged() {
    this.#Scale(zoomController.Value, zoomController.Value);
  }
}

class ZoomController extends EventTarget {
  /** @type {HTMLInputElement} */ #inputElement;
  /** @type {HTMLButtonElement} */ #plusButtonElement;
  /** @type {HTMLButtonElement} */ #minusButtonElement;
  /** @type {HTMLSpanElement} */ #valueElement;
  /** @type {Number} */ #value;
  /** @type {Number} */ #min;
  /** @type {Number} */ #max;
  /** @type {Number} */ #step;

  /**
   * @param {HTMLDivElement} containerElement
   */
  constructor(containerElement) {
    super();

    this.#inputElement = containerElement.querySelector(".zoom-input");
    this.#minusButtonElement =
      containerElement.querySelector(".zoom-button.minus");
    this.#plusButtonElement =
      containerElement.querySelector(".zoom-button.plus");
    this.#valueElement = containerElement.querySelector(".zoom-value");

    this.#inputElement.addEventListener(
      "change",
      this.#OnInputElementChange.bind(this)
    );
    this.#minusButtonElement.addEventListener(
      "click",
      this.#OnMinusButtonElementClick.bind(this)
    );
    this.#plusButtonElement.addEventListener(
      "click",
      this.#OnPlusButtonElementClick.bind(this)
    );

    this.#value = Number.parseFloat(this.#inputElement.value);
    this.#min = Number.parseFloat(this.#inputElement.min);
    this.#max = Number.parseFloat(this.#inputElement.max);
    this.#step = Number.parseFloat(this.#inputElement.step);
  }

  get Value() {
    return this.#value;
  }

  set Value(value) {
    if (value < this.#min) throw new Error();
    if (value > this.#max) throw new Error();

    if (value === this.#value) return;

    this.#value = value;

    this.#inputElement.value = this.#value;
    this.#valueElement.innerText = "x" + this.#value.toFixed(1);

    this.dispatchEvent(new CustomEvent("changed"));

    console.log(this);
  }

  get Min() {
    return this.#min;
  }

  set Min(value) {
    this.#min = value;

    if (Value < this.#min) Value = this.#min;
  }

  get Max() {
    return this.#max;
  }

  set Max(value) {
    this.#max = value;

    if (Value > this.#max) Value = this.#max;
  }

  /** @param {Number} value */
  Add(value) {
    value = this.Value + value;

    if (value > this.#max) value = this.#max;

    this.Value = value;
  }

  /** @param {Number} value */
  Substract(value) {
    value = this.Value - value;

    if (value < this.#min) value = this.#min;

    this.Value = value;
  }

  StepForward() {
    this.Add(this.#step);
  }

  StepBack() {
    this.Substract(this.#step);
  }

  #OnInputElementChange(e) {
    this.Value = Number.parseFloat(e.target.value);
  }

  #OnMinusButtonElementClick() {
    this.StepBack();
  }

  #OnPlusButtonElementClick() {
    this.StepForward();
  }
}

const zoomController = new ZoomController(
  document.getElementById("zoom-controls")
);

const imageCollectionController = new ImageCollectionController(zoomController);

imageCollectionController.Add(document.getElementById("image-container-1"));
imageCollectionController.Add(document.getElementById("image-container-2"));
