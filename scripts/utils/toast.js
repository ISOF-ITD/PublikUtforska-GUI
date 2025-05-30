import { toast } from "react-hot-toast";

export const toastInfo = (m) => toast(m, { icon: "ℹ️" });
export const toastOk = (m) => toast.success(m);
export const toastError = (m) => toast.error(m);
