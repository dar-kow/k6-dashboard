import React, { memo, useCallback } from "react";
import { TestFile } from "@/types/testResults";
import Tab from "./Tab";

interface TabGroupProps {
  files: TestFile[];
  selectedFile: string | null;
  onFileChange: (fileName: string) => void;
  customClassName?: string;
}

const TabGroup: React.FC<TabGroupProps> = ({
  files,
  selectedFile,
  onFileChange,
  customClassName,
}) => {
  const formatFileName = useCallback((fileName: string) => {
    return fileName
      .replace(".json", "")
      .replace(/-/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }, []);

  const baseClass = "m-tab-group";
  const finalClassName = [baseClass, customClassName].filter(Boolean).join(" ");

  return (
    <div className={finalClassName}>
      <div className="m-tab-group__nav">
        <nav className="m-tab-group__list">
          {files.length === 0 ? (
            <div className="m-tab-group__empty-message">
              No test files available
            </div>
          ) : (
            files.map((file) => (
              <Tab
                key={file.name}
                label={formatFileName(file.name)}
                isActive={selectedFile === file.name}
                onClick={() => onFileChange(file.name)}
              />
            ))
          )}
        </nav>
      </div>
    </div>
  );
};

export default memo(TabGroup);