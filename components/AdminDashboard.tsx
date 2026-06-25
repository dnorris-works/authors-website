                                <img
                                    src={viewing.book.coverUrl}
                                    alt=""
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    style={{ width: '80px', height: '120px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
                                />