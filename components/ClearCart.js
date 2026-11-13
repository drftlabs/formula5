"use client";
import { useEffect } from "react";
import { useShop } from "./ShopProvider";
export default function ClearCart() { const { clear } = useShop(); useEffect(() => { clear(); }, []); return null; } // eslint-disable-line
