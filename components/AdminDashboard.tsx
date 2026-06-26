                                <Field label="Slug (used in the URL, e.g. witness-persists)">
                                    <input
                                        type="text"
                                        value={editingDownload.slug}
                                        onChange={e => setEditingDownload({ ...editingDownload, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                                        className="w-full border rounded-lg px-4 py-2 text-base outline-none"
                                        style={inputStyle}
                                        placeholder="witness-persists"
                                    />
                                </Field>