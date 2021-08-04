class ReadBuffer {
    constructor(arrayBuffer) {
        this.offset = 0;
        this.buffer = new DataView(arrayBuffer);
    }
    /**
     * read_bool
     */
    read_bool() {
        const res = this.buffer.getUint8(this.offset);
        this.offset += 1;
        // scuffed typescript casting
        return res;
    }
    /**
     * read_ubyte
     */
    read_ubyte() {
        const res = this.buffer.getUint8(this.offset);
        this.offset += 1;
        return res;
    }
    /**
     * read_ushort
     */
    read_ushort() {
        const res = this.buffer.getUint16(this.offset, true);
        this.offset += 2;
        return res;
    }
    /**
     * read_uint
     */
    read_uint() {
        const res = this.buffer.getUint32(this.offset, true);
        this.offset += 4;
        return res;
    }
    // /**
    //  * read_ulong
    //  */
    // public read_ulong(): number {
    //   const res = this.buffer.getBigInt64(this.offset, true);
    //   this.offset += 4;
    //   return res;
    // }
    /**
     * read_float
     */
    read_float() {
        const res = this.buffer.getFloat32(this.offset, true);
        this.offset += 4;
        return res;
    }
    /**
     * read_double
     */
    read_double() {
        const res = this.buffer.getFloat64(this.offset, true);
        this.offset += 8;
        return res;
    }
    // osu specific
    /**
     * read_string
     */
    read_string() {
        var strlen = 0;
        var strflag = this.read_ubyte();
        if (strflag == 0x0b) {
            strlen = 0;
            var shift = 0;
            // uleb128
            // https://en.wikipedia.org/wiki/LEB128
            while (true) {
                var byte = this.read_ubyte();
                strlen |= (byte & 0x7f) << shift;
                if ((byte & (1 << 7)) == 0) {
                    break;
                }
                shift += 7;
            }
            var string = "";
            for (var i = 0; i < strlen; i++) {
                string += String.fromCharCode(this.read_ubyte());
            }
            return string;
        }
        return "";
    }
    read_int_double() {
        this.read_ubyte();
        const integer = this.read_uint();
        this.read_ubyte();
        const double = this.read_double();
        return [integer, double];
    }
    read_timing_point() {
        const bpm = this.read_double();
        const offset = this.read_double();
        const inherited = this.read_bool();
        return [bpm, offset, inherited];
    }
    skip_bytes(numBytes) {
        this.offset += numBytes;
    }
}
class OsuDB {
    constructor(dbBuffer) {
        this.buffer = new ReadBuffer(dbBuffer);
        this.version = this.buffer.read_uint();
        this.folderCount = this.buffer.read_uint();
        this.accountUnlocked = this.buffer.read_bool();
        // skip dateUnlocked
        this.buffer.skip_bytes(8);
        this.playerName = this.buffer.read_string();
        this.numBeatmaps = this.buffer.read_uint();
        this.beatmapData = null;
        console.log(this.playerName);
    }
    readBeatmap() {
        const map = {};
        if (this.version < 20191106) {
            map["size"] = this.buffer.read_uint();
        }
        map["artist"] = this.buffer.read_string();
        map["artist_unicode"] = this.buffer.read_string();
        map["song_title"] = this.buffer.read_string();
        map["song_title_unicode"] = this.buffer.read_string();
        map["mapper"] = this.buffer.read_string();
        map["difficulty"] = this.buffer.read_string();
        map["audio_file"] = this.buffer.read_string();
        map["md5_hash"] = this.buffer.read_string();
        map["map_file"] = this.buffer.read_string();
        map["ranked_status"] = this.buffer.read_ubyte();
        map["num_hitcircles"] = this.buffer.read_ushort();
        map["num_sliders"] = this.buffer.read_ushort();
        map["num_spinners"] = this.buffer.read_ushort();
        // map["last_modified"] = this.buffer.read_ulong();
        // todo: implement longs
        this.buffer.skip_bytes(8);
        map["approach_rate"] = this.buffer.read_float();
        map["circle_size"] = this.buffer.read_float();
        map["hp_drain"] = this.buffer.read_float();
        map["overall_difficulty"] = this.buffer.read_float();
        map["slider_velocity"] = this.buffer.read_double();
        // skip these int double pairs
        var int = this.buffer.read_uint();
        for (var i = 0; i < int; i++) {
            // this.buffer.read_int_double();
            this.buffer.skip_bytes(14);
        }
        var int = this.buffer.read_uint();
        for (var i = 0; i < int; i++) {
            // this.buffer.read_int_double();
            this.buffer.skip_bytes(14);
        }
        var int = this.buffer.read_uint();
        for (var i = 0; i < int; i++) {
            // this.buffer.read_int_double();
            this.buffer.skip_bytes(14);
        }
        var int = this.buffer.read_uint();
        for (var i = 0; i < int; i++) {
            // this.buffer.read_int_double();
            this.buffer.skip_bytes(14);
        }
        map["drain_time"] = this.buffer.read_uint();
        map["total_time"] = this.buffer.read_uint();
        map["preview_time"] = this.buffer.read_uint();
        // skip timing points
        var int = this.buffer.read_uint();
        for (var i = 0; i < int; i++) {
            // this.buffer.read_timing_point();
            this.buffer.skip_bytes(17);
        }
        map["beatmap_id"] = this.buffer.read_uint();
        map["beatmap_set_id"] = this.buffer.read_uint();
        map["thread_id"] = this.buffer.read_uint();
        map["grade_standard"] = this.buffer.read_ubyte();
        map["grade_taiko"] = this.buffer.read_ubyte();
        map["grade_ctb"] = this.buffer.read_ubyte();
        map["grade_mania"] = this.buffer.read_ubyte();
        map["local_offset"] = this.buffer.read_ushort();
        map["stack_leniency"] = this.buffer.read_float();
        map["gameplay_mode"] = this.buffer.read_ubyte();
        map["song_source"] = this.buffer.read_string();
        map["song_tags"] = this.buffer.read_string();
        map["online_offset"] = this.buffer.read_ushort();
        map["title_font"] = this.buffer.read_string();
        map["is_unplayed"] = this.buffer.read_bool();
        // map["last_played"] = this.buffer.read_ulong();
        this.buffer.skip_bytes(8);
        map["is_osz2"] = this.buffer.read_bool();
        map["folder_name"] = this.buffer.read_string();
        // map["last_checked"] = this.buffer.read_ulong();
        this.buffer.skip_bytes(8);
        map["ignore_sounds"] = this.buffer.read_bool();
        map["ignore_skin"] = this.buffer.read_bool();
        map["disable_storyboard"] = this.buffer.read_bool();
        map["disable_video"] = this.buffer.read_bool();
        map["visual_override"] = this.buffer.read_bool();
        map["last_modified2"] = this.buffer.read_uint();
        map["scroll_speed"] = this.buffer.read_ubyte();
        return map;
    }
    readBeatmaps() {
        if (this.beatmapData != null) {
            return this.beatmapData;
        }
        const maps = {};
        for (var i = 0; i < this.numBeatmaps; i++) {
            var map = this.readBeatmap();
            maps[map.md5_hash] = map;
        }
        this.beatmapData = maps;
        return maps;
    }
}
class CollectionDB {
    constructor(dbBuffer) {
        this.buffer = new ReadBuffer(dbBuffer);
        this.version = this.buffer.read_uint();
        this.numCollections = this.buffer.read_uint();
        this.collections = null;
    }
    readCollections() {
        // check cache
        if (this.collections != null) {
            return this.collections;
        }
        const collections = {};
        collections["version"] = this.version;
        collections["numCollections"] = this.numCollections;
        collections["collections"] = [];
        for (var i = 0; i < this.numCollections; i++) {
            var collection = {};
            collection["name"] = this.buffer.read_string();
            collection["size"] = this.buffer.read_uint();
            collection["hashes"] = [];
            for (var j = 0; j < collection["size"]; j++) {
                collection["hashes"].push(this.buffer.read_string());
            }
            collections["collections"].push(collection);
        }
        this.collections = collections;
        return collections;
    }
}
