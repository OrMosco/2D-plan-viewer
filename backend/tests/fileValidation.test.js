"use strict";

const { validateFileType, validateFileSize, getExtension, MAX_FILE_SIZE_BYTES } = require("../src/utils/fileValidation");

describe("fileValidation", () => {
  describe("getExtension", () => {
    it("returns lower-cased extension", () => {
      expect(getExtension("Blueprint.PDF")).toBe("pdf");
    });

    it("returns empty string for files with no extension", () => {
      expect(getExtension("Makefile")).toBe("");
    });

    it("handles multiple dots correctly", () => {
      expect(getExtension("archive.tar.gz")).toBe("gz");
    });
  });

  describe("validateFileType", () => {
    it("accepts a supported extension (pdf)", () => {
      const result = validateFileType("design.pdf");
      expect(result.valid).toBe(true);
      expect(result.extension).toBe("pdf");
      expect(result.mimeType).toBe("application/pdf");
    });

    it("accepts a supported extension (png)", () => {
      const result = validateFileType("plan.PNG");
      expect(result.valid).toBe(true);
      expect(result.extension).toBe("png");
    });

    it("accepts a CAD extension (dwg)", () => {
      const result = validateFileType("floor-plan.dwg");
      expect(result.valid).toBe(true);
      expect(result.extension).toBe("dwg");
    });

    it("rejects an unsupported extension", () => {
      const result = validateFileType("script.sh");
      expect(result.valid).toBe(false);
      expect(result.mimeType).toBeNull();
    });

    it("rejects a file with no extension", () => {
      const result = validateFileType("Makefile");
      expect(result.valid).toBe(false);
    });
  });

  describe("validateFileSize", () => {
    it("accepts a valid size", () => {
      expect(validateFileSize(1024)).toBe(true);
    });

    it("accepts exactly the maximum size", () => {
      expect(validateFileSize(MAX_FILE_SIZE_BYTES)).toBe(true);
    });

    it("rejects a size of 0", () => {
      expect(validateFileSize(0)).toBe(false);
    });

    it("rejects a negative size", () => {
      expect(validateFileSize(-100)).toBe(false);
    });

    it("rejects a size exceeding the maximum", () => {
      expect(validateFileSize(MAX_FILE_SIZE_BYTES + 1)).toBe(false);
    });

    it("rejects a non-integer size", () => {
      expect(validateFileSize(1024.5)).toBe(false);
    });
  });
});
