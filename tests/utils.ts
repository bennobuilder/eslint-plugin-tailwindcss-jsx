export function createGenerateErrors(errorId: string) {
  return (count: number) => {
    return Array.from(Array(count)).map(() => ({ messageId: errorId }));
  };
}
