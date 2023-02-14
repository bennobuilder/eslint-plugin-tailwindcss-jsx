export type TMessageIds = 'invalidInline' | 'invalidOrder';
export type TOptions = [];

export type TClassNameExtraction = {
  type: 'Node';
};

export type TClassNameExtractionTree = {
  type: 'NodeTree';
};

export type TGetIdentifierFromClassNameResponse = {
  newClassName: string;
  identifier: string | null;
};
