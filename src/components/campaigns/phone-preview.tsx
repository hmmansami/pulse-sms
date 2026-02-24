type PhonePreviewProps = {
  body: string;
  imageUrl?: string;
};

export function PhonePreview({ body, imageUrl }: PhonePreviewProps) {
  return (
    <div className="mx-auto w-full max-w-xs rounded-[2.2rem] border-8 border-gray-900 bg-black p-3 shadow-xl">
      <div className="relative overflow-hidden rounded-[1.6rem] bg-gray-100 p-3">
        <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-gray-400" />
        <div className="space-y-2">
          <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-blue-500 px-3 py-2 text-sm text-white">
            {body || "Your message preview appears here..."}
          </div>
          {imageUrl ? (
            <div className="overflow-hidden rounded-2xl border bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="MMS preview" className="h-40 w-full object-cover" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
