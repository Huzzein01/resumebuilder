import { createAtsTemplate } from "./AtsResumeTemplate.js";

/** The original single-column template -- now just the "classic" variant of the shared ATS template factory. Kept as its own export for backward compatibility with anything importing it directly. */
export default createAtsTemplate("classic");
