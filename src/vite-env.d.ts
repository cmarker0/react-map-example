/// <reference types="vite/client" />

declare module "react-simple-maps" {
  import type { CSSProperties, ReactNode, MouseEvent } from "react";

  export interface Geography {
    rsmKey: string;
    id: string;
    [key: string]: unknown;
  }

  export interface GeographyStyle {
    fill?: string;
    outline?: string;
    stroke?: string;
    filter?: string;
  }

  export function ComposableMap(props: {
    projection?: string;
    projectionConfig?: Record<string, unknown>;
    width?: number;
    height?: number;
    style?: CSSProperties;
    children?: ReactNode;
  }): JSX.Element;

  export function Sphere(props: {
    id: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  }): JSX.Element;

  export function Graticule(props: {
    stroke?: string;
    strokeWidth?: number;
  }): JSX.Element;

  export function Geographies(props: {
    geography: string | object;
    children: (props: { geographies: Geography[] }) => ReactNode;
  }): JSX.Element;

  export function Geography(props: {
    key?: string;
    geography: Geography;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: {
      default?: GeographyStyle;
      hover?: GeographyStyle;
      pressed?: GeographyStyle;
    };
    onMouseEnter?: (event: MouseEvent<SVGPathElement>) => void;
    onMouseMove?: (event: MouseEvent<SVGPathElement>) => void;
    onMouseLeave?: (event: MouseEvent<SVGPathElement>) => void;
  }): JSX.Element;
}
