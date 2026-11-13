"use client";
import { openTrack } from "./TrackModal";
export default function TrackOpen({ className, children, order = "" }) { return <button type="button" className={className} onClick={() => openTrack(order)}>{children}</button>; }
