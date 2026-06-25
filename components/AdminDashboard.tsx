                                    <div
                                        key={book.id}
                                        className="flex justify-between items-center rounded-lg px-5 py-4"
                                        style={{ backgroundColor: '#ffffff', border: '1px solid #e8dfd5' }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={book.coverUrl}
                                                alt={book.title}
                                                style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                                            />
                                            <div>
                                                <button
                                                    onClick={() => startView(author.key, book)}
                                                    className="font-medium text-left hover:underline"
                                                    style={{ color: '#2c2c2c', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                                >
                                                    {book.title || '(untitled)'}
                                                </button>
                                                {book.comingSoon && (
                                                    <p className="text-sm mt-0.5" style={{ color: '#8c7b6b' }}>
                                                        Coming Soon
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => startEdit(author.key, book)}
                                                className="text-sm px-3 py-1.5 rounded border transition-opacity hover:opacity-60"
                                                style={{ borderColor: '#d4c9be', color: '#6b4c3b' }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(author.key, book.id)}
                                                className="text-sm px-3 py-1.5 rounded border transition-opacity hover:opacity-60"
                                                style={{ borderColor: '#f4a4a4', color: '#c0392b' }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>