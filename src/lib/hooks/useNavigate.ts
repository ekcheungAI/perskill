import { useCallback } from "react";
import { useLocation } from "wouter";

/** useNavigate — navigate(path) works like react-router's useNavigate */
export function useNavigate() {
  const [, navigate] = useLocation();
  return navigate;
}
