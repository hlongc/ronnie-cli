import { Command } from "commander";
import { version } from "../package.json";

const program = new Command("ronnie");

program.version(version);
