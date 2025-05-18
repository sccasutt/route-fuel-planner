
import { RouteType } from "./route";

/**
 * Extended RouteData interface with additional properties
 */
export interface RouteData extends RouteType {
  [key: string]: any;
}
