export class ApiResponse<T> {
  public readonly success = true;

  constructor(
    public readonly statusCode: number,
    public readonly data: T,
    public readonly message = 'Success',
  ) {}
}
