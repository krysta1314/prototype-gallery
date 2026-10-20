import { createContext, useContext } from "react";

/**
 * 静帧模式：评审「用户旅程图」里的缩小截图用。为 true 时，会自己往下走的屏(Face ID 自动通过等)停在当前这一帧，
 * 不然截图一渲染就跳到下一屏。真机 / 开发原型里永远是 false
 */
export const StillContext = createContext(false);
export const useStill = () => useContext(StillContext);
