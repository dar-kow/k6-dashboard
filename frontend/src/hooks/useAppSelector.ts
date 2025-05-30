import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../store/index";

export const useAppSelector = <T>(selector: (state: RootState) => T): T =>
  useSelector(selector);

export const useAppDispatch = () => useDispatch<AppDispatch>();
